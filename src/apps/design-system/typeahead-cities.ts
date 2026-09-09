import type {TypeaheadItem} from '../../ui/Typeahead.tsx';

export const typeaheadCities: TypeaheadItem[] = [
  {value: 'calgary-ab', name: 'Calgary, AB', description: 'Alberta'},
  {value: 'charlottetown-pe', name: 'Charlottetown, PE', description: 'Prince Edward Island'},
  {value: 'edmonton-ab', name: 'Edmonton, AB', description: 'Alberta'},
  {value: 'fredericton-nb', name: 'Fredericton, NB', description: 'New Brunswick'},
  {value: 'moncton-nb', name: 'Moncton, NB', description: 'New Brunswick'},
  {value: 'saintjohn-nb', name: 'Saint John, NB', description: 'New Brunswick'},
  {value: 'halifax-ns', name: 'Halifax, NS', description: 'Nova Scotia'},
  {value: 'moncton-nb', name: 'Moncton, NB', description: 'New Brunswick'},
  {value: 'montreal-qc', name: 'Montréal, QC', description: 'Quebec'},
  {value: 'ottawa-on', name: 'Ottawa, ON', description: 'Ontario'},
  {value: 'quebec-qc', name: 'Québec City, QC', description: 'Quebec'},
  {value: 'regina-sk', name: 'Regina, SK', description: 'Saskatchewan'},
  {value: 'saskatoon-sk', name: 'Saskatoon, SK', description: 'Saskatchewan'},
  {value: 'st-johns-nl', name: 'St. John’s, NL', description: 'Newfoundland and Labrador'},
  {
    value: 'toronto-on',
    name: 'Toronto, ON',
    description: 'Ontario',
    data: {provinceCode: 'ON', populationYear: 2021},
  },
  {value: 'vancouver-bc', name: 'Vancouver, BC', description: 'British Columbia'},
  {value: 'victoria-bc', name: 'Victoria, BC', description: 'British Columbia'},
  {value: 'winnipeg-mb', name: 'Winnipeg, MB', description: 'Manitoba'},
];
