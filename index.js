const fs = require('fs');
const fetch = require('node-fetch');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

const OUT_DIR = __dirname+'/out';
const FROM = '2019-01-01T00:00:00Z';
const TO = '2019-02-01T00:00:00Z';
const TARIFFS = [
    { name: "Eastern", code: "E-1R-AGILE-18-02-21-A", gsp: '_A' },
    { name: "EastMidlands", code: "E-1R-AGILE-18-02-21-B", gsp: '_B' },
    { name: "London", code: "E-1R-AGILE-18-02-21-C", gsp: '_C' },
    { name: "MerseysideAndNorthWales", code: "E-1R-AGILE-18-02-21-D", gsp: '_D' },
    { name: "NorthScotland", code: "E-1R-AGILE-18-02-21-P", gsp: '_P' },
    { name: "NorthWestern", code: "E-1R-AGILE-18-02-21-G", gsp: '_G' },
    { name: "Northern", code: "E-1R-AGILE-18-02-21-F", gsp: '_F' },
    { name: "SouthEastern", code: "E-1R-AGILE-18-02-21-J", gsp: '_J' },
    { name: "SouthScotland", code: "E-1R-AGILE-18-02-21-N", gsp: '_N' },
    { name: "SouthWales", code: "E-1R-AGILE-18-02-21-K", gsp: '_K' },
    { name: "SouthWestern", code: "E-1R-AGILE-18-02-21-L", gsp: '_L' },
    { name: "Southern", code: "E-1R-AGILE-18-02-21-H", gsp: '_H' },
    { name: "Yorkshire", code: "E-1R-AGILE-18-02-21-M", gsp: '_M' }
];

const getApiUrl = (from, to, tariff) =>
    `https://api.octopus.energy/v1/products/AGILE-18-02-21/electricity-tariffs/${tariff}/standard-unit-rates/?period_from=${from}&period_to=${to}&page_size=1500`;

const getFileName = (tariff) => `${OUT_DIR}/${tariff.name} (${tariff.code}).csv`;

const formatTariffData = (tariff, tariffData) => tariffData.map(tariffEntry => {
    const from = new Date(tariffEntry.valid_from).toISOString();
    const to = new Date(tariffEntry.valid_to).toISOString();
    return {
        date: from.slice(0, 10),
        from: from.slice(11, 19),
        to: to.slice(11, 19),
        code: tariff.code,
        gsp: tariff.gsp,
        region_name: tariff.name,
        unit_rate_excl_vat: tariffEntry.value_exc_vat,
        unit_rate_incl_vat: tariffEntry.value_inc_vat
    }
});

const saveToCsv = (filename, formattedTariffData) => {
    fs.writeFile(filename, '', err => {
        if (err) console.error(err)
    });

    const csvWriter = createCsvWriter({
        path: filename,
        header: [
            {id: 'date', title: 'date'},
            {id: 'from', title: 'from'},
            {id: 'to', title: 'to'},
            {id: 'code', title: 'code'},
            {id: 'gsp', title: 'gsp'},
            {id: 'region_name', title: 'region_name'},
            {id: 'unit_rate_excl_vat', title: 'unit_rate_excl_vat'},
            {id: 'unit_rate_incl_vat', title: 'unit_rate_incl_vat'},
        ]
    });

    csvWriter.writeRecords(formattedTariffData).then(() => console.log("Successfully wrote data to ", filename))
};

// main
TARIFFS.forEach(tariff => {
   fetch(getApiUrl(FROM, TO, tariff.code))
       .then(res => res.json())
       .then(res => res.results)
       .then(tariffData => formatTariffData(tariff, tariffData))
       .then(data => {
           data.sort((a, b) => new Date(a.date) - new Date(b.date))
           const filename = getFileName(tariff);
           saveToCsv(filename, data);
       }).catch(error => {
           console.error("Something went wrong retrieving data for tariff", tariff.name);
           console.error(error);
       })
});