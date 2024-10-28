
import createCsvWriter from "csv-writer";

// Configuración del escritor CSV
const csvWriter = createCsvWriter.createObjectCsvWriter({
  path: "resultados.csv", // Nombre del archivo CSV
  header: [
    { id: "sku", title: "SKU" },
    { id: "found", title: "Found" },
    { id: "existAgeRange", title: "Exist Age Range" },
    { id: "validAgeRange", title: "Valid Age Range" },
    { id: "trCount", title: "TR Count" },
  ],
});

describe("Text Validation on Specific Page", () => {
  const skus = ["883242026", "883242038", "883247881", "19845353"]; // Lista de SKUs a buscar

  skus.forEach((sku) => {
    it(`should check for the presence of the text "${sku}"`, async () => {
      // URL de la página que deseas probar
      const url = "https://www.falabella.com.pe/falabella-pe";
      await browser.url(url);

      // Esperar a que la página cargue completamente
      await browser.waitUntil(
        async () => {
          const title = await browser.getTitle();
          return title !== "";
        },
        {
          timeout: 5000,
          timeoutMsg: "Page did not load in time",
        }
      );

      // Encontrar el campo de búsqueda por ID y escribir el SKU
      const searchBox = await $("#testId-SearchBar-Input"); // Asegúrate de que este ID sea correcto
      await searchBox.setValue(sku);

      // Presionar Enter usando browser.keys()
      await browser.keys("Enter");

      // Esperar a que la nueva página cargue
      await browser.waitUntil(
        async () => {
          const title = await browser.getTitle();
          return title !== "";
        },
        {
          timeout: 5000,
          timeoutMsg: "Search results page did not load in time",
        }
      );

      // Verificar que el texto del SKU esté presente en la página
      const pageContent = await $("body").getText(); // Obtener el texto del cuerpo de la página
      const errorText = "Lo sentimos, no encontramos resultados para";
      const found = !pageContent.includes(errorText) && pageContent.includes(sku);

      let existAgeRange = false;
      let validAgeRange = false;
      let trCount = 0;

      if (found) {
        existAgeRange = pageContent.includes("Grupo de edad");
        const ageRanges = ["0-1 año", "2-3 años", "4-5 años", "6-8 años", "9-11 años", "+12 años", "Todas las edades"];
        validAgeRange = ageRanges.some((ageRange) => pageContent.includes(ageRange));

        // Contar la cantidad de etiquetas tr en todo el documento
        const trElements = await $$("tr");
        trCount = trElements.length;
      }

      // Escribir resultados en el archivo CSV
      const foundText = found ? "PUBLICADO" : "NO PUBLICADO";
      const existAgeRangeText = found ? (existAgeRange ? "CON RANGO EDAD" : "SIN GRUPO EDAD") : "-";
      const validAgeRangeText = found && existAgeRange ? (validAgeRange ? "OK" : "GRUPO EDAD INCORRECTO") : "-";
      const trCountText = trCount === 0 ? "SIN FICHA" : (trCount <= 5 ? "POCA INFORMACIÓN" : "OK");

      await csvWriter.writeRecords([{ sku, found: foundText, existAgeRange: existAgeRangeText, validAgeRange: validAgeRangeText, trCount: trCountText }]).then(() => {
        console.log(`Resultados para ${sku} escritos en resultados.csv`);
      });
    });
  });
});
