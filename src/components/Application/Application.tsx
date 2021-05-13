import * as React from 'react';

import xml2js from 'xml2js';
import * as moment from 'moment';

import { InfoTabs } from './components/InfoTabs';
import { CreatinineClearanceForm } from './components/CreatinineClearanceForm';
import { creatinineClearance } from '#root/src/texts/advice';
import { capitalizeFirstLetter } from '#root/src/utils/capitalizeFirstLetter';
import { CreatinineClearanceCalculation } from '#root/src/interfaces/CreatinineClearanceCalculation';

import './styles.css';

export const Application = () => {
  const [prefilledValues, setPrefilledValues] = React.useState(null);
  const [calcaulationResults, setCalcaulationResults] = React.useState(null);

  React.useEffect(() => {
    async function fetchData() {
      const [patientMainInfo, weightObservations, heightObservations] = await Promise.all(
        await Promise.all(
          await Promise.all([
            fetch('https://open-ic.epic.com/FHIR/api/FHIR/DSTU2/Patient/Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB'),
            fetch(
              'https://open-ic.epic.com/FHIR/api/FHIR/DSTU2/Observation?patient=Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB&code=29463-7'
            ),
            fetch(
              'https://open-ic.epic.com/FHIR/api/FHIR/DSTU2/Observation?patient=Tbt3KuCY0B5PSrJvCu2j-PlK.aiHsu2xUjUM8bWpetXoB&code=8302-2'
            ),
          ]).then((requests) => requests.map((request) => request.text()))
        ).then((requestsText) => requestsText.map((requestText) => xml2js.parseStringPromise(requestText)))
      );

      const dob = patientMainInfo.Patient.birthDate[0].$.value;
      const sex = patientMainInfo.Patient.gender[0].$.value;
      const weightKg = weightObservations.Bundle.entry[0].resource[0].Observation[0].valueQuantity[0].value[0].$.value;
      const heightSm = heightObservations.Bundle.entry[0].resource[0].Observation[0].valueQuantity[0].value[0].$.value;

      setPrefilledValues({
        age: String(moment().diff(moment(dob, 'YYYY-MM-DD'), 'years')),
        sex: capitalizeFirstLetter(sex),
        weight: weightKg,
        height: heightSm,
      });
    }

    fetchData();
  }, []);

  const handleCreatinineClearanceFormSubmit = React.useCallback((formData) => {
    const parsedFormData: CreatinineClearanceCalculation = {
      sex: formData.sex,
      age: parseInt(formData.age, 10),
      weight: parseFloat(formData.weight),
      height: parseFloat(formData.height),
      creatinine: parseFloat(formData.creatinine),
    };

    let score = 0;
    if (parsedFormData.sex === 'Male') {
      score += 1;
    }
    if (parsedFormData.age > 40) {
      score += 1;
    }
    if (parsedFormData.weight > 60) {
      score += 1;
    }
    if (parsedFormData.creatinine > 0.7) {
      score += 1;
    }
    if (parsedFormData.height > 160) {
      score += 1;
    }

    const severity = score > 3 ? 'hight' : 'low';

    setCalcaulationResults(`result: score ${score}, ${severity} `);
  }, []);

  return (
    <div className="container">
      <InfoTabs advice={creatinineClearance} />
      <CreatinineClearanceForm data={prefilledValues} onSubmit={handleCreatinineClearanceFormSubmit} />
      {calcaulationResults ? <p>{calcaulationResults}</p> : null}
    </div>
  );
};
