const { XMLParser } = require('fast-xml-parser');

const mockXml = `
<TEI>
  <teiHeader>
    <fileDesc>
      <titleStmt><title>My Research Paper</title></titleStmt>
      <sourceDesc><biblStruct/></sourceDesc>
    </fileDesc>
    <profileDesc>
      <abstract><p>This is my abstract.</p></abstract>
    </profileDesc>
  </teiHeader>
  <text>
    <body>
      <div><head>Introduction</head><p>Introduction text here.</p></div>
      <div><head>Methods</head><p>Methods text here.</p></div>
    </body>
  </text>
</TEI>
`;

const parser = new XMLParser({
  ignoreAttributes: true,
  parseTagValue: true,
  trimValues: true,
});

const parsed = parser.parse(mockXml);

// Replicate the type guard logic
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function hasProperty(obj, key) {
  return key in obj;
}

function isGrobidTeiXml(data) {
  if (!isRecord(data)) {
    console.log('FAIL: Not a record');
    return false;
  }

  // GROBID can return either { TEI: {...} } or direct {...}
  const root = hasProperty(data, 'TEI') && isRecord(data.TEI) ? data.TEI : data;
  console.log('Root:', root === data ? 'data itself' : 'data.TEI');

  if (!isRecord(root)) {
    console.log('FAIL: Root not a record');
    return false;
  }

  // Check teiHeader exists and is an object
  if (!hasProperty(root, 'teiHeader') || !isRecord(root.teiHeader)) {
    console.log('FAIL: teiHeader missing or not a record');
    return false;
  }

  const teiHeader = root.teiHeader;

  // Check fileDesc exists
  if (!hasProperty(teiHeader, 'fileDesc') || !isRecord(teiHeader.fileDesc)) {
    console.log('FAIL: fileDesc missing or not a record');
    return false;
  }

  // Check text.body exists
  if (!hasProperty(root, 'text') || !isRecord(root.text)) {
    console.log('FAIL: text missing or not a record');
    return false;
  }

  const text = root.text;

  if (!hasProperty(text, 'body') || !isRecord(text.body)) {
    console.log('FAIL: body missing or not a record');
    return false;
  }

  // Validate body.div is an array (optional but if present must be array)
  const body = text.body;
  if (hasProperty(body, 'div') && !Array.isArray(body.div)) {
    console.log('FAIL: div exists but is not an array');
    return false;
  }

  console.log('SUCCESS: Valid GROBID TEI XML');
  return true;
}

console.log('Testing type guard on parsed XML:');
const isValid = isGrobidTeiXml(parsed);
console.log('Result:', isValid);
