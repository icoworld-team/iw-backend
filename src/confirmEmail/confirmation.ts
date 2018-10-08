import User from "../models/user";

export async function updateConfirmationStatus(userId, confirmationStatus) {
  await User.findByIdAndUpdate(userId, { confirmation: confirmationStatus });
}