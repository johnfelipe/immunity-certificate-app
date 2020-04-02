import React, { useState, Fragment } from 'react';
import { Formik, Form } from 'formik';
import QRCode from 'qrcode.react';
import * as Yup from 'yup';

import LegacyQrReader from '/core/components/LegacyQrReader';
import { DateTimeFields, TextField } from '/core/forms/fields';
import { generatePepper } from "/core/utils";
import { SEPARATOR } from "/core/constants";

const today = new Date();
const todayStr = today.toISOString().slice(0, 10);
const inSixMonthsStr = new Date(today.setMonth(today.getMonth() + 6)).toISOString().slice(0, 10);


const IssueCertificateForm = () => {

  const [qrValue, setQrValue] = useState('');

  const onCreateClick = (values) => {
    if (!values.idNumber) return false;
    const pepper = generatePepper(8);
    setQrValue(`${values.idNumber}${SEPARATOR}${pepper}`);
  }

  return (
    <Formik
      initialValues={{
        identityMethod: 'create',
        personalCode: '',
        idNumber: '',
        testKitId: '',
        expiryDate: inSixMonthsStr,
        expiryTime: '09:00',
        sampleDate: todayStr,
        sampleTime: '09:00',
      }}
      validationSchema={Yup.object({
        idNumber: Yup.string(),
        testKitId: Yup.string().required('This field is required'),
        expiryDate: Yup.string().required('This field is required'),
        expiryTime: Yup.string().required('This field is required'),
        sampleDate: Yup.string().required('This field is required'),
        sampleTime: Yup.string().required('This field is required'),
      })}
      onSubmit={(values, { setSubmitting }) => {
        const valueToHash = values.identityMethod === 'create' ? qrValue : values.personalCode;
        const personHash = web3.utils.sha3(valueToHash);
        const sampleTimestamp = Math.floor(Date.parse(`${values.sampleDate}T${values.sampleTime}`) / 1000);
        const expiryTimestamp = Math.floor(Date.parse(`${values.expiryDate}T${values.expiryTime}`) / 1000);
        issueCertificate(
          personHash,
          sampleTimestamp,
          expiryTimestamp,
          values.testKitId,
        )
        setSubmitting(false);
      }}
    >
      {({ isSubmitting, values, setFieldValue, handleBlur, handleChange }) => {
        const onScan = (result) => {
          result && setFieldValue('personalCode', result);
        }
        return (
          <Form>

            <h2>Choose Identity</h2>

            <div className="text-align-left">
              <input
                type="radio"
                id="identityMethod_1"
                name="identityMethod"
                value="create"
                checked={values.identityMethod == 'create'}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <label className="label-inline" htmlFor="identityMethod_1" >Create new identity</label>
              <br/>
              <input
                type="radio"
                id="identityMethod_2"
                name="identityMethod"
                value="scan"
                checked={values.identityMethod == 'scan'}
                onChange={handleChange}
                onBlur={handleBlur}
              />
              <label className="label-inline" htmlFor="identityMethod_2">Scan existing ID</label>
            </div>

            { values.identityMethod === 'create' && (
              <Fragment>
                <TextField label="Passport ID" name="idNumber" type="text" />
                <button className="button" type="button" onClick={(_e) => onCreateClick(values)} >
                  Create
                </button>
                { qrValue && <QRCode className="qr-code-img" value={qrValue} level="H" /> }
              </Fragment>
            )}

            {values.identityMethod === 'scan' && (
              <Fragment>
                <LegacyQrReader onScan={onScan} />
                {values.personalCode && (
                  <Fragment>
                    <label>Passport ID</label>
                    <input type="text" value={values.personalCode.split(SEPARATOR)[0]} readOnly/>
                  </Fragment>
                )}
              </Fragment>
            )}

            <hr />

            <h2>Issue Certificate</h2>

            <TextField
              label="Test Kit ID"
              name="testKitId"
              type="text"
            />

            <DateTimeFields
              label="Sample Date and Time"
              nameDate="sampleDate"
              nameTime="sampleTime"
            />

            <DateTimeFields
              label="Expiry Date and Time"
              nameDate="expiryDate"
              nameTime="expiryTime"
            />

            <button className="button" type="submit" disabled={isSubmitting}>
              Submit
            </button>

          </Form>
        );
      }}
    </Formik>
  );
};


export default IssueCertificateForm;
