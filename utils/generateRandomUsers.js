import { faker } from '@faker-js/faker';

const statusCategories = ['Active', 'Inactive', 'Suspended', 'New'];
const locations = ['Mainland', 'Island', 'Outskirt'];

export function generateRandomUsers(count = 10) {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: faker.person.fullName(),
    phoneNumber: faker.phone.number('+234 ### ### ####'),
    email: faker.internet.email(),
    orderCount: faker.number.int({ min: 0, max: 100 }),
    statusCategory: faker.helpers.arrayElement(statusCategories),
    location: faker.helpers.arrayElement(locations),
    businessCategory: faker.company.buzzNoun(),
  }));
}