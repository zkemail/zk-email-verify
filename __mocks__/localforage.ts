const getUncompressedTestFile = (): ArrayBuffer => {
  const buffer = fs.readFileSync(`${__dirname}/../__fixtures__/compressed-files/uncompressed-value.txt`);
  return buffer;
}

const tempStorage = {
  "email.zkeyb": getUncompressedTestFile(),
  "email.zkeyc": getUncompressedTestFile(),
  "email.zkeyd": getUncompressedTestFile(),
  "email.zkeye": getUncompressedTestFile(),
  "email.zkeyf": getUncompressedTestFile(),
  "email.zkeyg": getUncompressedTestFile(),
  "email.zkeyh": getUncompressedTestFile(),
  "email.zkeyi": getUncompressedTestFile(),
  "email.zkeyj": getUncompressedTestFile(),
  "email.zkeyk": getUncompressedTestFile(),
};

const getItem = jest.fn((key)=>{
  return tempStorage[key];
});

const setItem = jest.fn();

const locaforage = {
    getItem,
    setItem
  };

export default locaforage;