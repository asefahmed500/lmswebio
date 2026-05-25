import { defineConfig } from "prisma/config"

export default defineConfig({
  datasource: {
    url: "postgresql://postgres:asef@localhost:5432/lmsioweb",
  },
})
