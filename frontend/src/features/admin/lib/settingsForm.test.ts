import { describe, expect, it } from 'vitest';
import { getSettingsFormValues, toSettingsMutationPayload } from '@/features/admin/lib/settingsForm';

describe('settingsForm', () => {
  it('maps grouped settings responses to plain form values', () => {
    expect(getSettingsFormValues({ data: { site_name: 'Dhanvanthiri Foods', currency: 'INR' } })).toEqual({
      site_name: 'Dhanvanthiri Foods',
      currency: 'INR',
    });
  });

  it('unwraps nested admin settings responses from the Laravel API envelope', () => {
    expect(getSettingsFormValues({
      data: {
        data: {
          smtp_host: 'smtp.example.com',
          smtp_port: 587,
          smtp_enabled: true,
        },
      },
    })).toEqual({
      smtp_host: 'smtp.example.com',
      smtp_port: '587',
      smtp_enabled: '1',
    });
  });

  it('serializes edited values into the backend bulk update shape', () => {
    expect(toSettingsMutationPayload('shipping', {
      free_threshold: 499,
      flat_charge: 49,
      shipping_enabled: true,
    })).toEqual({
      settings: [
        { group: 'shipping', key: 'free_threshold', value: 499 },
        { group: 'shipping', key: 'flat_charge', value: 49 },
        { group: 'shipping', key: 'shipping_enabled', value: true },
      ],
    });
  });
});
