import Swal from 'sweetalert2';

export const showConfirmDialog = async (title, html, confirmButtonText = 'Yes', type = 'warning') => {
  return await Swal.fire({
    title,
    html,
    icon: type,
    showCancelButton: true,
    confirmButtonColor: type === 'warning' ? '#ef4444' : '#3b82f6',
    cancelButtonColor: '#64748b',
    confirmButtonText,
    cancelButtonText: 'Cancel',
    reverseButtons: true
  });
};

export const showSuccessDialog = (title, message) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'success',
    confirmButtonColor: '#10b981',
    confirmButtonText: 'OK'
  });
};

export const showErrorDialog = (title, message) => {
  return Swal.fire({
    title,
    text: message,
    icon: 'error',
    confirmButtonColor: '#ef4444',
    confirmButtonText: 'OK'
  });
};

export const showLoadingDialog = (title = 'Please wait...') => {
  Swal.fire({
    title,
    html: 'Processing your request...',
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    willOpen: () => {
      Swal.showLoading();
    }
  });
};

export const closeLoadingDialog = () => {
  Swal.close();
};