/**
 * @license MIT License
 * @copyright KINOSHITA minoru, All Rights Reserved.
 */
import { Property } from '../src/property';
import { EPC } from '../src/epc';

test('Property INSTANCE_LIST_NOTIFICATION', () => {
  const property = new Property(EPC.INSTANCE_LIST_NOTIFICATION);
  expect(property.toString()).toMatchSnapshot();
});

test('Property INSTANTANEOUS_ELECTRIC_ENERGY', () => {
  const property = new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY);
  expect(property.toString()).toMatchSnapshot();
});

test('Property INSTANCE_LIST_NOTIFICATION with edt', () => {
  const data = Buffer.from('12345678', 'hex');
  const property = new Property(EPC.INSTANCE_LIST_NOTIFICATION, data);
  expect(property.toString()).toMatchSnapshot();
  expect(Property.confirmed(property).toString()).toMatchSnapshot();
});

test('Property INSTANTANEOUS_ELECTRIC_ENERGY with edt', () => {
  const data = Buffer.from('90abcdef12345678', 'hex');
  const property = new Property(EPC.INSTANTANEOUS_ELECTRIC_ENERGY, data);
  expect(property.toString()).toMatchSnapshot();
  expect(Property.confirmed(property).toString()).toMatchSnapshot();
});
