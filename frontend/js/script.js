// const dataResponse = await fetch("/api/data");
const URL = "http://localhost:3000";
const dataResponse = await fetch(`${URL}/api/data`);
const data = await dataResponse.json();
console.log(data);
