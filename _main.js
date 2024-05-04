// start script: $ node _main.js

const fs = require("fs");
const https = require("https");

// Пример использования
async function main() {
  try {
    const url = "https://de-pa.by/api/v1/items";
    const items = await fetchData(url);

    const path = "./raw";
    const models = await listFilesInDirectory(path);
    const arr = [];
    for (let i = 0; i < models.length; ++i) {
      const currentModel = models[i];
      for (let j = 0; j < items.length; ++j) {
        const currentItem = items[j];
        if (currentModel === currentItem.dp_seoUrlSegment) {
          const files = await listFilesInDirectory(`${path}/${currentModel}`);
          const ph_catalogs = files.filter((e) => e.startsWith("catalog_"));
          const ph_draws = files.filter((e) => e.startsWith("draw_"));
          const ph_yt = files.filter((e) => e.startsWith("youtube_"));
          const ph_other = files.filter(
            (e) =>
              !e.startsWith("youtube_") &&
              !e.startsWith("youtube_") &&
              !e.startsWith("draw_")
          );

          const IMAGES = [...ph_other, ...ph_draws, ...ph_yt, ...ph_catalogs];

          const photos = IMAGES.map((e) => {
            return `https://ooodepa.github.io/nomenclature-images-raw/raw/${currentModel}/${e}`;
          });
          const id = currentItem.dp_id;
          arr.push({
            ...currentItem,
            dp_itemGalery: photos.slice(1).map((e) => {
              return {
                dp_id: 0,
                dp_itemId: id,
                dp_photoUrl: e,
              };
            }),
            dp_photoUrl: photos[0],
            dp_photos: photos.join("\n"),
          });
        }
      }
    }

    await fs.promises.writeFile("result.json", JSON.stringify(arr, null, 2));
    await fs.promises.writeFile("result.min.json", JSON.stringify(arr));
  } catch (exception) {
    console.log(exception);
  }
}

// Вызов функции
main();

// Функция для выполнения GET запроса и получения данных JSON
async function fetchData(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        let data = "";

        response.on("data", (chunk) => {
          data += chunk;
        });

        response.on("end", () => {
          try {
            const jsonData = JSON.parse(data);
            resolve(jsonData);
          } catch (error) {
            reject(new Error("Ошибка парсинга JSON: " + error.message));
          }
        });
      })
      .on("error", (error) => {
        reject(new Error("Произошла ошибка запроса: " + error.message));
      });
  });
}

async function listFilesInDirectory(directoryPath) {
  try {
    const files = await fs.promises.readdir(directoryPath);
    return files;
  } catch (err) {
    return [];
  }
}
