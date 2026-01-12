// Generate a unique 5-character room code
export function generateRoomCode(): string {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let code = ""
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length))
  }
  return code
}
