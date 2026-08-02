export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const validationMessages = {
  required: "Kolom ini wajib diisi.",
  email: "Masukkan alamat email yang valid.",
  phone: "Masukkan nomor HP yang valid.",
  password: "Password minimal 8 karakter dan harus mengandung huruf besar, angka, dan simbol.",
  confirmPassword: "Konfirmasi password tidak sama.",
  file: "Pilih file JPG, PNG, atau PDF maksimal 5 MB.",
};
