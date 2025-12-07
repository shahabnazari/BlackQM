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
console.log('Full parsed structure:');
console.log(JSON.stringify(parsed, null, 2));

console.log('\n\nExtracting root:');
const root = parsed.TEI || parsed;
console.log(JSON.stringify(root, null, 2));

console.log('\n\nExtracting title:');
console.log('root.teiHeader:', root.teiHeader ? 'exists' : 'undefined');
console.log('root.teiHeader.fileDesc:', root.teiHeader?.fileDesc ? 'exists' : 'undefined');
console.log('root.teiHeader.fileDesc.titleStmt:', root.teiHeader?.fileDesc?.titleStmt ? 'exists' : 'undefined');
console.log('root.teiHeader.fileDesc.titleStmt.title:', root.teiHeader?.fileDesc?.titleStmt?.title);

console.log('\n\nExtracting abstract:');
console.log('root.teiHeader.profileDesc:', root.teiHeader?.profileDesc ? 'exists' : 'undefined');
console.log('root.teiHeader.profileDesc.abstract:', root.teiHeader?.profileDesc?.abstract ? 'exists' : 'undefined');
console.log('root.teiHeader.profileDesc.abstract.p:', root.teiHeader?.profileDesc?.abstract?.p);

console.log('\n\nExtracting sections:');
console.log('root.text:', root.text ? 'exists' : 'undefined');
console.log('root.text.body:', root.text?.body ? 'exists' : 'undefined');
console.log('root.text.body.div:', root.text?.body?.div);
