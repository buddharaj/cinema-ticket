// helper common function to check if value is a integer number greater than 0
export default isPositive = (value) =>
  value && Number.isInteger(value) && value > 0;
