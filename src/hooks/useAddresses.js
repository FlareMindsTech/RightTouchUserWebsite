import { useCallback, useEffect, useState } from 'react';
import {
  getMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress as deleteAddressApi
} from '../services/addressService';

const normalizePayload = (data = {}) => {
  const phone = String(data.phone || data.mobileNumber || '').trim();
  const pincode = String(data.pincode || '').trim();
  const lat = data.latitude;
  const lng = data.longitude;

  return {
    ...data,
    label: String(data.label || 'home').toLowerCase(),
    phone: phone || undefined,
    pincode: /^[0-9]{6}$/.test(pincode) ? pincode : undefined,
    latitude: lat === '' || lat === undefined ? undefined : lat,
    longitude: lng === '' || lng === undefined ? undefined : lng
  };
};

const useAddresses = (currentUser, showToast) => {
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchAddresses = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const response = await getMyAddresses();
      const list = response?.result || response?.data || response || [];
      if (Array.isArray(list)) {
        setAddresses(list);
        setSelectedAddress((prev) => {
          if (prev && list.some((a) => a._id === prev._id)) {
            return list.find((a) => a._id === prev._id) || prev;
          }
          return list.find((a) => a.isDefault) || list[0] || null;
        });
      }
      return response;
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
      showToast?.('Failed to load addresses');
      return null;
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (currentUser?._id) {
      fetchAddresses();
    } else {
      setAddresses([]);
      setSelectedAddress(null);
    }
  }, [currentUser?._id, fetchAddresses]);

  const addAddress = useCallback(async (data) => {
    try {
      const response = await createAddress(normalizePayload(data));
      if (response?.success) {
        await fetchAddresses(true);
        return response.result || true;
      }
      showToast?.(response?.message || 'Failed to add address');
      return null;
    } catch (error) {
      console.error('Add address error:', error);
      showToast?.('Error adding address');
      return null;
    }
  }, [fetchAddresses, showToast]);

  const editAddress = useCallback(async (id, data) => {
    try {
      const response = await updateAddress({ ...normalizePayload(data), id });
      if (response?.success) {
        await fetchAddresses(true);
        return response.result || true;
      }
      showToast?.(response?.message || 'Failed to update address');
      return null;
    } catch (error) {
      console.error('Edit address error:', error);
      showToast?.('Error updating address');
      return null;
    }
  }, [fetchAddresses, showToast]);

  const deleteAddress = useCallback(async (id) => {
    try {
      const response = await deleteAddressApi({ id });
      if (response?.success) {
        await fetchAddresses(true);
        return true;
      }
      showToast?.(response?.message || 'Failed to delete address');
      return false;
    } catch (error) {
      console.error('Delete address error:', error);
      showToast?.('Error deleting address');
      return false;
    }
  }, [fetchAddresses, showToast]);

  const setDefaultAddress = useCallback(async (id) => {
    try {
      const response = await updateAddress({ id, isDefault: true });
      if (response?.success) {
        await fetchAddresses(true);
        return true;
      }
      showToast?.(response?.message || 'Failed to set default address');
      return false;
    } catch (error) {
      console.error('Set default address error:', error);
      showToast?.('Failed to set default address');
      return false;
    }
  }, [fetchAddresses, showToast]);

  return {
    addresses,
    selectedAddress,
    setSelectedAddress,
    loading,
    fetchAddresses,
    addAddress,
    editAddress,
    deleteAddress,
    setDefaultAddress
  };
};

export { useAddresses };
