import { Module } from "@medusajs/framework/utils"
import TrainingModuleService from "./service"

export const TRAINING_MODULE = "training"

export default Module(TRAINING_MODULE, {
  service: TrainingModuleService,
})
