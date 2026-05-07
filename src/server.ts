import "dotenv/config";
import app from "./app";
import { getRequiredNumberEnv } from "./config/env";

const PORT = getRequiredNumberEnv("PORT");

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
