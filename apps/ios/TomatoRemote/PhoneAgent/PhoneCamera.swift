//
//  PhoneCamera.swift
//  Tomato Remote
//
//  The system camera, presented for one prompt photo.
//
//  Photos picked from the library go through `PhotosPicker`; this wrapper is
//  only for taking a new picture. The caller owns presentation and appends the
//  returned image to the staged set after downscaling it.
//

import SwiftUI
import UIKit

/// A full-screen camera sheet that hands back one photo.
struct PhoneCamera: UIViewControllerRepresentable {
    /// Receives the full-size capture; the caller downscales it.
    let onPhoto: (UIImage) -> Void
    /// Called when the owner backs out without taking a picture.
    let onCancel: () -> Void

    /// Whether this device can run the camera at all. A simulator cannot.
    static var isAvailable: Bool {
        UIImagePickerController.isSourceTypeAvailable(.camera)
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.cameraCaptureMode = .photo
        picker.allowsEditing = false
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ controller: UIImagePickerController, context: Context) {}

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        private let parent: PhoneCamera

        init(_ parent: PhoneCamera) {
            self.parent = parent
        }

        func imagePickerController(
            _ picker: UIImagePickerController,
            didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]
        ) {
            if let image = info[.originalImage] as? UIImage {
                parent.onPhoto(image)
            } else {
                parent.onCancel()
            }
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) {
            parent.onCancel()
        }
    }
}
