// Each test file boots its own Medusa app; clear MikroORM's cached entity
// metadata so models are registered fresh.
const { MetadataStorage } = require("@mikro-orm/core")

MetadataStorage.clear()
