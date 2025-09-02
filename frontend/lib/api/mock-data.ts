// Mock data for development and fallback when backend is unavailable

export const mockStudy = {
  id: 'study-1',
  title: 'Climate Change Perspectives Study',
  description: 'Understanding different viewpoints on climate change and environmental policy',
  welcomeMessage: 'Welcome to our climate change perspectives study. Your participation helps us understand diverse viewpoints on this important topic.',
  consentText: 'By participating in this study, you consent to the use of your responses for research purposes. All data will be anonymized.',
  gridColumns: 9,
  gridShape: 'quasi-normal',
  enablePreScreening: false,
  enablePostSurvey: true,
  enableVideoConferencing: false,
};

export const mockStatements = [
  { id: '1', text: 'Climate change is primarily caused by human activities', order: 1 },
  { id: '2', text: 'Economic growth should take priority over environmental concerns', order: 2 },
  { id: '3', text: 'Renewable energy can fully replace fossil fuels within 20 years', order: 3 },
  { id: '4', text: 'Individual actions make a significant difference in fighting climate change', order: 4 },
  { id: '5', text: 'Governments should impose carbon taxes on businesses', order: 5 },
  { id: '6', text: 'Climate change effects are exaggerated by the media', order: 6 },
  { id: '7', text: 'Technology will solve climate problems without lifestyle changes', order: 7 },
  { id: '8', text: 'Developing countries should have different emission standards', order: 8 },
  { id: '9', text: 'Nuclear energy is essential for a carbon-free future', order: 9 },
  { id: '10', text: 'Climate change is a natural cycle, not human-caused', order: 10 },
  { id: '11', text: 'We should prioritize adaptation over prevention', order: 11 },
  { id: '12', text: 'Electric vehicles are the solution to transportation emissions', order: 12 },
  { id: '13', text: 'Meat consumption must be reduced to combat climate change', order: 13 },
  { id: '14', text: 'Climate refugees will be the biggest crisis of the century', order: 14 },
  { id: '15', text: 'Geoengineering is our best hope for reversing climate change', order: 15 },
  { id: '16', text: 'Local food systems are key to reducing emissions', order: 16 },
  { id: '17', text: 'Carbon capture technology is more important than reducing emissions', order: 17 },
  { id: '18', text: 'Climate change will benefit some regions economically', order: 18 },
  { id: '19', text: 'International cooperation is impossible on climate issues', order: 19 },
  { id: '20', text: 'Future generations will find solutions we cannot imagine today', order: 20 },
];

export const mockSession = {
  sessionCode: 'mock-session-123',
  studyId: 'study-1',
  studyTitle: mockStudy.title,
  studyDescription: mockStudy.description,
  gridColumns: mockStudy.gridColumns,
  gridShape: mockStudy.gridShape,
  gridConfig: {
    columns: [
      { position: -4, maxItems: 1, label: 'Strongly Disagree' },
      { position: -3, maxItems: 2, label: 'Disagree' },
      { position: -2, maxItems: 3, label: 'Somewhat Disagree' },
      { position: -1, maxItems: 4, label: 'Slightly Disagree' },
      { position: 0, maxItems: 5, label: 'Neutral' },
      { position: 1, maxItems: 4, label: 'Slightly Agree' },
      { position: 2, maxItems: 3, label: 'Somewhat Agree' },
      { position: 3, maxItems: 2, label: 'Agree' },
      { position: 4, maxItems: 1, label: 'Strongly Agree' },
    ]
  }
};

export const mockProgress = {
  currentStep: 'welcome',
  completedSteps: [],
  progress: 0,
};