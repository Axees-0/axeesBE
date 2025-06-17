import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  Platform,
  Linking,
  StyleSheet,
} from "react-native";

interface FilePreviewProps {
  visible: boolean;
  file: {
    fileUrl?: string;
    originalName?: string;
    type?: string;
  } | null;
  onClose: () => void;
}

export default function FilePreviewModal({
  visible,
  file,
  onClose,
}: FilePreviewProps) {
  const isStartsWithHttp =
    file?.fileUrl?.startsWith("http://") ||
    file?.fileUrl?.startsWith("https://");

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>X</Text>
          </TouchableOpacity>

          {file?.fileUrl?.endsWith(".pdf") || isStartsWithHttp ? (
            <iframe
              src={file?.fileUrl}
              style={{ width: "100%", height: 500 }}
              frameBorder="0"
            ></iframe>
          ) : file && file.fileUrl ? (
            // Check if it's an image by extension or if file has a type/mimeType property
            (/\.(jpg|jpeg|png|gif|bmp|svg|webp)$/i.test(file.fileUrl) ||
              (file.type && file.type.startsWith("image/"))) &&
            !file.fileUrl.endsWith(".pdf") ? (
              // If it's an image, display with Image component
              <Image
                source={{ uri: file.fileUrl }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            ) : (
              // Not identified as an image, display in iframe
              <iframe
                src={file.fileUrl}
                style={{ width: "100%", height: 500 }}
                frameBorder="0"
              ></iframe>
            )
          ) : (
            <Text style={styles.noFileText}>No file to preview.</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "100%",
    maxWidth: 1280,
    marginHorizontal: "auto",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
    position: "relative",
  },
  closeButton: {
    position: "absolute",
    top: 10,
    right: 10,
    zIndex: 2,
    backgroundColor: "#430B92",
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  openPdfButton: {
    backgroundColor: "#430B92",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 20,
  },
  openPdfText: {
    color: "#fff",
    fontSize: 16,
  },
  previewImage: {
    width: "100%",
    height: 300,
  },
  noFileText: {
    fontSize: 16,
    color: "#666",
    marginTop: 20,
  },
  pdfPreview: {
    width: "100%",
    maxHeight: 500,
  },
});
