import { plainToInstance } from 'class-transformer';
import { UpdateVariantDto } from './update-product.dto.js';
import { CreateVariantDto } from './create-product.dto.js';

describe('UpdateVariantDto', () => {
  it('leaves the stock out of the draft when quantity is left out, so it is kept', () => {
    const variant = plainToInstance(UpdateVariantDto, { id: 'v-1', price: '10.00' });

    expect(variant.toDraft()).toMatchObject({ id: 'v-1', inventory: { tracked: true } });
    expect(variant.toDraft().inventory.quantity).toBeUndefined();
  });

  it('sends the quantity when one is given', () => {
    const variant = plainToInstance(UpdateVariantDto, { id: 'v-1', price: '10.00', quantity: 3 });

    expect(variant.toDraft().inventory.quantity).toBe(3);
  });
});

describe('CreateVariantDto', () => {
  it('opens a new variant with no stock when quantity is left out', () => {
    const variant = plainToInstance(CreateVariantDto, { price: '10.00' });

    expect(variant.toDraft().inventory.quantity).toBe(0);
  });
});
