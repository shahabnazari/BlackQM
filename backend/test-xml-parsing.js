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

console.log('Parsed XML structure:');
console.log(JSON.stringify(parsed, null, 2));
