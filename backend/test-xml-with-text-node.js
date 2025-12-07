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

// Use the same options as the service
const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  textNodeName: '#text',
  parseTagValue: true,
  trimValues: true,
  allowBooleanAttributes: true,
  ignoreDeclaration: true,
});

const parsed = parser.parse(mockXml);
console.log('Parsed with textNodeName:');
console.log(JSON.stringify(parsed, null, 2));

const root = parsed.TEI || parsed;
console.log('\n\nRoot teiHeader.fileDesc.titleStmt:');
console.log(JSON.stringify(root.teiHeader?.fileDesc?.titleStmt, null, 2));
