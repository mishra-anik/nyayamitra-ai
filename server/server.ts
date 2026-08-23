import "dotenv/config";
import app from "./src/app";

const PORT = process.env.PORT;


app.listen(PORT, () => {
  console.log("server is running");
});
