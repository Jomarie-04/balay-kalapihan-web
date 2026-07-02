/**
 * Payment Verification Service
 * Handles all payment verification logic including validation, upload, and verification workflow
 */

interface PaymentVerificationData {
  paymentMethod: 'gcash' | 'maya';
  referenceNumber: string;
  proofFile?: File;
  amount: number;
}

interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

interface PendingVerification {
  id: string;
  orderNumber: string;
  customerName: string;
  totalAmount: number;
  paymentMethod: string;
  paymentReferenceNumber: string;
  paymentProofPath?: string;
  createdAt: string;
}

/**
 * Validates payment verification data
 * @param data Payment verification data to validate
 * @returns Validation result with error message if invalid
 */
const apiBaseUrl = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') ? 'http://localhost:5000/api' : '/api');

export function validatePaymentData(data: PaymentVerificationData): { valid: boolean; error?: string } {
  // Validate payment method
  if (!data.paymentMethod || !['gcash', 'maya'].includes(data.paymentMethod)) {
    return { valid: false, error: 'Invalid payment method' };
  }

  // Validate reference number
  if (!data.referenceNumber || data.referenceNumber.trim().length === 0) {
    return { valid: false, error: 'Reference number is required' };
  }

  if (data.referenceNumber.length < 3) {
    return { valid: false, error: 'Reference number must be at least 3 characters' };
  }

  // Validate proof file
  if (!data.proofFile) {
    return { valid: false, error: 'Proof of payment file is required' };
  }

  // Validate file type (image only)
  const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (!validImageTypes.includes(data.proofFile.type)) {
    return { valid: false, error: 'Please upload a valid image file (JPG, PNG, GIF, or WebP)' };
  }

  // Validate file size (max 10MB)
  const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
  if (data.proofFile.size > maxSizeInBytes) {
    return { valid: false, error: 'File size must not exceed 10MB' };
  }

  // Validate amount
  if (!data.amount || data.amount <= 0) {
    return { valid: false, error: 'Invalid order amount' };
  }

  return { valid: true };
}

/**
 * Uploads proof of payment file to backend
 * @param file File to upload
 * @returns Response with file path
 */
export async function uploadPaymentProof(file: File): Promise<PaymentVerificationResponse> {
  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${apiBaseUrl}/payment-proof-upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: 'Failed to upload proof file',
        error: error.message || 'Unknown error',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Proof file uploaded successfully',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error uploading proof file',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Submits payment verification to backend
 * @param orderData Order and payment data
 * @param proofFilePath Path to uploaded proof file
 * @returns Response from backend
 */
export async function submitPaymentVerification(
  orderData: any,
  proofFilePath?: string
): Promise<PaymentVerificationResponse> {
  try {
    const response = await fetch(`${apiBaseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...orderData,
        status: 'pending',
        paymentProofPath: proofFilePath,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: 'Failed to submit payment verification',
        error: error.message || 'Unknown error',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Payment verification submitted successfully',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error submitting payment verification',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetches pending payment verifications for admin
 * @param adminToken Admin authentication token
 * @returns Array of pending verifications
 */
export async function fetchPendingVerifications(adminToken: string): Promise<PendingVerification[]> {
  try {
    const response = await fetch(`${apiBaseUrl}/admin/payment-verifications`, {
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pending verifications');
    }

    const data = await response.json();
    return data.pending || [];
  } catch (error) {
    console.error('Error fetching pending verifications:', error);
    return [];
  }
}

/**
 * Approves a payment verification
 * @param orderId Order ID to approve
 * @param adminToken Admin authentication token
 * @returns Approval response
 */
export async function approvePaymentVerification(
  orderId: string,
  adminToken: string
): Promise<PaymentVerificationResponse> {
  try {
    const response = await fetch(`${apiBaseUrl}/admin/payment-verifications/${orderId}/approve`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: 'Failed to approve payment',
        error: error.message || 'Unknown error',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Payment approved successfully',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error approving payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Rejects a payment verification
 * @param orderId Order ID to reject
 * @param reason Rejection reason
 * @param adminToken Admin authentication token
 * @returns Rejection response
 */
export async function rejectPaymentVerification(
  orderId: string,
  reason: string,
  adminToken: string
): Promise<PaymentVerificationResponse> {
  try {
    const response = await fetch(`${apiBaseUrl}/admin/payment-verifications/${orderId}/reject`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        message: 'Failed to reject payment',
        error: error.message || 'Unknown error',
      };
    }

    const data = await response.json();
    return {
      success: true,
      message: 'Payment rejected successfully',
      data: data,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Error rejecting payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Formats payment verification display data
 * @param verification Verification data from backend
 * @returns Formatted display object
 */
export function formatVerificationDisplay(verification: any) {
  return {
    id: verification.id || '',
    orderNumber: verification.orderNumber || verification.order_number || '',
    customerName: verification.customerName || verification.customer_name || 'N/A',
    amount: verification.totalAmount || verification.total || 0,
    method: verification.paymentMethod || verification.payment_method || 'N/A',
    reference: verification.paymentReferenceNumber || verification.payment_reference_number || 'N/A',
    proofPath: verification.paymentProofPath || verification.payment_proof_path || '',
    submittedAt: new Date(verification.createdAt || verification.created_at),
    formattedAmount: `₱${(verification.totalAmount || verification.total || 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`,
    formattedDate: new Date(verification.createdAt || verification.created_at).toLocaleDateString('en-PH'),
    formattedTime: new Date(verification.createdAt || verification.created_at).toLocaleTimeString('en-PH'),
  };
}

/**
 * Completes the full payment verification workflow
 * @param paymentData Payment data from form
 * @param orderData Order data to submit
 * @returns Completion response
 */
export async function completePaymentVerification(
  paymentData: PaymentVerificationData,
  orderData: any
): Promise<PaymentVerificationResponse> {
  // Validate payment data
  const validation = validatePaymentData(paymentData);
  if (!validation.valid) {
    return {
      success: false,
      message: 'Payment data validation failed',
      error: validation.error,
    };
  }

  // Upload proof file
  if (!paymentData.proofFile) {
    return {
      success: false,
      message: 'Proof file is missing',
      error: 'No proof file provided',
    };
  }

  const uploadResponse = await uploadPaymentProof(paymentData.proofFile);
  if (!uploadResponse.success) {
    return uploadResponse;
  }

  // Prepare complete order data
  const completeOrderData = {
    ...orderData,
    paymentMethod: paymentData.paymentMethod,
    paymentReferenceNumber: paymentData.referenceNumber,
    paymentProofPath: uploadResponse.data?.filePath,
      status: 'pending',
  );

  return submissionResponse;
}
