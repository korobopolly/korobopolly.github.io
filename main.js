//import apiKey from './apikey.js';

document.getElementById('fetchButton').addEventListener('click', () => {
    const inputsrch     = document.getElementById('x_SRCH').value;
    const apiKey        = maple_apiKey;
    const characterName = encodeURIComponent(inputsrch); // Korean character name encoded for URL
    const url           = `https://open.api.nexon.com/maplestory/v1/id?character_name=${characterName}`;

    fetch(url, {
        method: 'GET',
        headers: {
            'accept'          : 'application/json',
            'x-nxopen-api-key': apiKey
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`Error: ${response.status} ${response.statusText}`);
        }
        return response.json();
    })
    .then(data => {
        const responseElement       = document.createElement('pre');
        responseElement.textContent = JSON.stringify(data, null, 2);
        //console.log(data.ocid);
        document.body.appendChild(responseElement);
    })
    .catch(error => {
        const errorElement       = document.createElement('pre');
        errorElement.textContent = error.message;
        document.body.appendChild(errorElement);
    });
});