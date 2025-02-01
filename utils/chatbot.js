import fs from 'fs';
import csv from 'csv-parser';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_KEY,
});

const datasetPath = `${import.meta.dirname}/dataset.csv`;
let plantData = [];

fs.createReadStream(datasetPath)
  .pipe(csv())
  .on('data', (row) => plantData.push(row))
  .on('end', () => {
    console.log('InitialMessage - Dataset loaded.');
  });

export const initialMessage = async ({plant, pH, temperature, humidity}) => {
  // Lookup plant in the dataset
  const plantInfo = plantData.find(
    (entry) => entry['Plant'].toLowerCase() === plant.toLowerCase()
  );

  if (!plantInfo) {
    return `Sorry, I don't have information about ${plant} yet.`;
  }

  const recommendedPH = plantInfo['Soil pH'];
  const recommendedTemp = plantInfo['Temperature (°C)'];
  const recommendedHumidity = plantInfo['Humidity (%)'];

  const isWithinRange = (value, range) => {
    const [min, max] = range.split('-').map(Number);
    return value >= min && value <= max;
  };

  const pHStatus = isWithinRange(pH, recommendedPH) ? 'within' : 'out of';
  const tempStatus = isWithinRange(temperature, recommendedTemp)
    ? 'within'
    : 'out of';
  const humidityStatus = isWithinRange(humidity, recommendedHumidity)
    ? 'within'
    : 'out of';

  const gptPrompt = `
    The plant is ${plant}. The input conditions are pH=${pH}, temperature=${temperature}°C, 
    and humidity=${humidity}%. The recommended ranges are:
    - Soil pH: ${recommendedPH} (${pHStatus} the range)
    - Temperature: ${recommendedTemp}°C (${tempStatus} the range)
    - Humidity: ${recommendedHumidity}% (${humidityStatus} the range)
  `;

  try {
    const gptResponse = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a helpful assistant named GreenieGenie for plant care.' },
        { role: 'user', content: gptPrompt },
      ],
      temperature: 0.7,
    });

    const initialMessage = gptResponse.choices[0].message.content.trim();
    return initialMessage;
  } catch (error) {
    console.error('Error fetching GPT response:', error.message);
    return 'Sorry, there was an error processing your request.';
  }
};