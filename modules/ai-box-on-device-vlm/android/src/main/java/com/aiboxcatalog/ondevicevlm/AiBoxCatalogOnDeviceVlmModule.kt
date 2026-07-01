package com.aiboxcatalog.ondevicevlm

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class AiBoxCatalogOnDeviceVlmModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("AiBoxCatalogOnDeviceVlm")

    AsyncFunction("extractItems") { request: Map<String, Any?> ->
      val boxId = request["boxId"] as? String
      val photos = request["photos"] as? List<*>

      require(!boxId.isNullOrBlank()) { "boxId is required" }
      require(!photos.isNullOrEmpty()) { "photos are required" }

      val items = photos.mapIndexed { index, rawPhoto ->
        val photo = rawPhoto as? Map<*, *> ?: error("photo payload must be an object")
        val photoId = photo["id"] as? String ?: error("photo id is required")
        val width = (photo["width"] as? Number)?.toInt() ?: 0
        val height = (photo["height"] as? Number)?.toInt() ?: 0
        val mimeType = photo["mimeType"] as? String ?: "image/jpeg"

        mapOf(
          "name" to "On-device mock item ${index + 1}",
          "attributes" to mapOf("category" to "mock"),
          "sourcePhotoIds" to listOf(photoId),
          "reason" to "Native mock extraction from ${width}x${height} $mimeType photo."
        )
      }

      mapOf("items" to items)
    }
  }
}
