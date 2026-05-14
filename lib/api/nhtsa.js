/**
 * NHTSA (National Highway Traffic Safety Administration) API Integration
 * Free US government API for vehicle and auto parts verification
 * No API key required
 */

const BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';

/**
 * Decode a VIN (Vehicle Identification Number)
 * @param {string} vin - 17-character VIN
 * @returns {object} Vehicle data or null
 */
async function decodeVIN(vin) {
  try {
    const url = `${BASE_URL}/DecodeVin/${vin}?format=json`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.Results && data.Results.length > 0) {
      // Extract key information from NHTSA results
      const getVal = (variable) => {
        const item = data.Results.find(r => r.Variable === variable);
        return item && item.Value && item.Value !== 'Not Applicable' ? item.Value : null;
      };

      return {
        found: true,
        source: 'NHTSA',
        vin,
        make: getVal('Make'),
        model: getVal('Model'),
        modelYear: getVal('Model Year'),
        bodyClass: getVal('Body Class'),
        engineType: getVal('Engine Model'),
        displacement: getVal('Displacement (L)'),
        fuelType: getVal('Fuel Type - Primary'),
        transmission: getVal('Transmission Style'),
        driveType: getVal('Drive Type'),
        manufacturer: getVal('Manufacturer Name'),
        plant: getVal('Plant Company Name'),
        plantCountry: getVal('Plant Country'),
        vehicleType: getVal('Vehicle Type'),
        doors: getVal('Doors'),
        seats: getVal('Seats'),
        airbags: getVal('Air Bag Locaton Curtain'),
        gvwr: getVal('GVWR'),
        allResults: data.Results.filter(r => r.Value && r.Value !== 'Not Applicable').map(r => ({
          variable: r.Variable,
          value: r.Value
        }))
      };
    }

    return { found: false, source: 'NHTSA', vin };
  } catch (error) {
    console.error('NHTSA VIN decode error:', error.message);
    return { found: false, source: 'NHTSA', vin, error: error.message };
  }
}

/**
 * Get safety recalls for a vehicle by make and model year
 * @param {string} make - Vehicle make (e.g., "Toyota")
 * @param {number} modelYear - Model year (e.g., 2020)
 * @returns {array} Recall data
 */
async function getRecalls(make, modelYear) {
  try {
    const url = `https://api.nhtsa.gov/recalls/recallsByVehicle?make=${encodeURIComponent(make)}&modelYear=${modelYear}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.results && data.results.length > 0) {
      return data.results.map(r => ({
        component: r.Component,
        summary: r.Summary,
        consequence: r.Conequence,
        remedy: r.Remedy,
        recallDate: r.ReportReceivedDate,
        recallNumber: r.NHTSACampaignNumber,
        recallType: r.CampaignType
      }));
    }

    return [];
  } catch (error) {
    console.error('NHTSA recalls error:', error.message);
    return [];
  }
}

/**
 * Decode a VIN and check for recalls
 * @param {string} vin - 17-character VIN
 * @returns {object} Combined vehicle and recall data
 */
async function verifyVehicle(vin) {
  const vehicleData = await decodeVIN(vin);
  
  let recalls = [];
  if (vehicleData.found && vehicleData.make && vehicleData.modelYear) {
    recalls = await getRecalls(vehicleData.make, vehicleData.modelYear);
  }

  return {
    vehicle: vehicleData,
    recalls: recalls.length > 0 ? recalls : null,
    hasRecalls: recalls.length > 0
  };
}

module.exports = { decodeVIN, getRecalls, verifyVehicle };