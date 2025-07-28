// Required packages:
// npm install axios csv-parse fs dotenv

const axios = require('axios');
const fs = require('fs');
const { parse } = require('csv-parse/sync');
require('dotenv').config();

const MASTER_CSV_URL = process.env.MASTER_CSV_URL;
const VARIANT_CSV_URL = process.env.VARIANT_CSV_URL;

async function fetchCSV(url) {
  const res = await axios.get(url);
  return parse(res.data, {
    columns: true,
    skip_empty_lines: true
  });
}

async function generateBikesJSON() {
  try {
    const master = await fetchCSV(MASTER_CSV_URL);
    const variants = await fetchCSV(VARIANT_CSV_URL);

    const masterMap = Object.fromEntries(master.map(m => [m.model_id, m]));

    const merged = variants.map(variant => {
      const model = masterMap[variant.model_id] || {};
      return {
        sku: variant.sku,
        name: variant.variant_name,
        product_url: variant.product_url,
        image_url: variant.image_url,
        sale_price: variant.sale_price,
        rrp: variant.rrp,
        price: variant.sale_price || variant.rrp,
        available: variant.availability.toLowerCase(),
        size: variant.size,
        colour: variant.color,
        ...model
      };
    });

    fs.writeFileSync('bikes.json', JSON.stringify(merged, null, 2));
    console.log(`✅ bikes.json generated with ${merged.length} entries.`);
  } catch (err) {
    console.error('❌ Failed to generate bikes.json:', err);
  }
}

generateBikesJSON();
