const polowania_c = document.querySelector('#polowania_c'); // Use querySelector for a single element
const struktury_c = document.querySelector('#struktury_c');

fetch("/data/data.json")
  .then((response) => response.json())
  .then((data) => {
    console.log(data);

    // Update the text content of the <p> elements
    polowania_c.textContent = data.polowania;
    struktury_c.textContent = data.struktury;
  })
  .catch((error) => {
    console.error("Błąd podczas ładowania pliku JSON:", error);
  });
