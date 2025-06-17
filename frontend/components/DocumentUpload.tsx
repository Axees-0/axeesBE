import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  Video,
  FileText,
  Palette,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Plus
} from 'lucide-react-native';
import {
  useDocumentSubmission,
  DocumentFile,
  DocumentSubmissionOptions,
  DocumentSubmissionResult
} from '@/utils/documentSubmissionService';
import Toast from 'react-native-toast-message';

interface DocumentUploadProps {
  onFilesChange?: (files: DocumentFile[]) => void;
  onUploadComplete?: (result: DocumentSubmissionResult) => void;
  onUploadError?: (error: string) => void;
  options?: DocumentSubmissionOptions;
  uploadEndpoint?: string;
  additionalData?: Record<string, any>;
  autoUpload?: boolean;
  title?: string;
  subtitle?: string;
  compact?: boolean;
  disabled?: boolean;
}

export default function DocumentUpload({
  onFilesChange,
  onUploadComplete,
  onUploadError,
  options = {},
  uploadEndpoint,
  additionalData = {},
  autoUpload = false,
  title = "Upload Documents",
  subtitle = "Drag and drop files here or click to browse",
  compact = false,
  disabled = false
}: DocumentUploadProps) {
  const dropZoneRef = useRef<View>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const {
    files,
    uploadProgress,
    isUploading,
    error,
    addFiles,
    removeFile,
    clearFiles,
    uploadFiles,
    setupDragAndDrop,
    service
  } = useDocumentSubmission(options);

  // Setup drag and drop for web
  useEffect(() => {
    if (Platform.OS === 'web' && dropZoneRef.current && !disabled) {
      const element = (dropZoneRef.current as any)._nativeTag 
        ? (dropZoneRef.current as any)._nativeTag 
        : dropZoneRef.current;
      
      const cleanup = setupDragAndDrop(element);
      return cleanup;
    }
  }, [setupDragAndDrop, disabled]);

  // Notify parent of file changes
  useEffect(() => {
    onFilesChange?.(files);
  }, [files, onFilesChange]);

  // Auto upload when files are added
  useEffect(() => {
    if (autoUpload && files.length > 0 && uploadEndpoint && !isUploading) {
      handleUpload();
    }
  }, [autoUpload, files.length, uploadEndpoint, isUploading]);

  const handleUpload = async () => {
    if (!uploadEndpoint) {
      onUploadError?.('Upload endpoint not specified');
      return;
    }

    try {
      const result = await uploadFiles(uploadEndpoint, additionalData);
      
      if (result.success) {
        Toast.show({
          type: 'success',
          text1: 'Upload Successful',
          text2: `${files.length} file(s) uploaded successfully`,
          visibilityTime: 3000
        });
        onUploadComplete?.(result);
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Upload failed';
      Toast.show({
        type: 'error',
        text1: 'Upload Failed',
        text2: errorMsg,
        visibilityTime: 4000
      });
      onUploadError?.(errorMsg);
    }
  };

  const handleAddFiles = async () => {
    if (disabled || isUploading) return;
    
    try {
      await addFiles();
    } catch (err: any) {
      Toast.show({
        type: 'error',
        text1: 'File Selection Failed',
        text2: err.message || 'Could not select files',
        visibilityTime: 4000
      });
    }
  };

  const handleRemoveFile = (fileId: string) => {
    if (disabled || isUploading) return;
    
    Alert.alert(
      'Remove File',
      'Are you sure you want to remove this file?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeFile(fileId) }
      ]
    );
  };

  const handleClearAll = () => {
    if (disabled || isUploading) return;
    
    Alert.alert(
      'Clear All Files',
      'Are you sure you want to remove all files?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear All', style: 'destructive', onPress: clearFiles }
      ]
    );
  };

  const renderFileIcon = (file: DocumentFile) => {
    const type = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase();
    const iconProps = { width: compact ? 16 : 20, height: compact ? 16 : 20, color: '#430B92' };

    if (type.includes('image/') || ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension || '')) {
      return <ImageIcon {...iconProps} />;
    } else if (type.includes('video/') || ['mp4', 'mov', 'avi', 'mkv', 'wmv'].includes(extension || '')) {
      return <Video {...iconProps} />;
    } else if (type.includes('pdf') || extension === 'pdf') {
      return <FileText {...iconProps} />;
    } else if (type.includes('photoshop') || extension === 'psd') {
      return <Palette {...iconProps} />;
    } else {
      return <File {...iconProps} />;
    }
  };

  const renderUploadZone = () => (
    <TouchableOpacity
      ref={dropZoneRef}
      style={[
        styles.uploadZone,
        compact && styles.uploadZoneCompact,
        isDragOver && styles.uploadZoneDragOver,
        disabled && styles.uploadZoneDisabled
      ]}
      onPress={handleAddFiles}
      disabled={disabled || isUploading}
    >
      <Upload 
        width={compact ? 24 : 32} 
        height={compact ? 24 : 32} 
        color={disabled ? '#9CA3AF' : '#430B92'} 
      />
      
      <Text style={[
        styles.uploadTitle,
        compact && styles.uploadTitleCompact,
        disabled && styles.uploadTitleDisabled
      ]}>
        {title}
      </Text>
      
      {!compact && (
        <Text style={[
          styles.uploadSubtitle,
          disabled && styles.uploadSubtitleDisabled
        ]}>
          {subtitle}
        </Text>
      )}
      
      {!compact && options.allowedTypes && (
        <Text style={[styles.uploadFormats, disabled && styles.uploadFormatsDisabled]}>
          Supported: {options.allowedTypes.map(type => type.split('/')[1]?.toUpperCase()).join(', ')}
        </Text>
      )}
      
      {!compact && options.maxFileSize && (
        <Text style={[styles.uploadLimits, disabled && styles.uploadLimitsDisabled]}>
          Max size: {service.formatFileSize(options.maxFileSize)} per file
        </Text>
      )}
    </TouchableOpacity>
  );

  const renderFileList = () => (
    <View style={styles.fileList}>
      {files.map((file) => {
        const progress = uploadProgress[file.id] || 0;
        const isCompleted = progress === 100;
        
        return (
          <View key={file.id} style={[styles.fileItem, compact && styles.fileItemCompact]}>
            <View style={styles.fileIcon}>
              {renderFileIcon(file)}
            </View>
            
            <View style={styles.fileInfo}>
              <Text style={[styles.fileName, compact && styles.fileNameCompact]} numberOfLines={1}>
                {file.name}
              </Text>
              
              {!compact && (
                <Text style={styles.fileSize}>
                  {service.formatFileSize(file.size)}
                </Text>
              )}
              
              {isUploading && progress > 0 && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{progress}%</Text>
                </View>
              )}
            </View>
            
            <View style={styles.fileActions}>
              {isCompleted && (
                <CheckCircle width={16} height={16} color="#10B981" />
              )}
              
              {!disabled && !isUploading && (
                <TouchableOpacity
                  style={styles.removeButton}
                  onPress={() => handleRemoveFile(file.id)}
                >
                  <X width={16} height={16} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );

  const renderControls = () => (
    <View style={styles.controls}>
      {files.length > 0 && !compact && (
        <TouchableOpacity
          style={[styles.controlButton, styles.clearButton]}
          onPress={handleClearAll}
          disabled={disabled || isUploading}
        >
          <RotateCcw width={16} height={16} color="#6B7280" />
          <Text style={styles.controlButtonText}>Clear All</Text>
        </TouchableOpacity>
      )}
      
      {files.length > 0 && (
        <TouchableOpacity
          style={[styles.controlButton, styles.addMoreButton]}
          onPress={handleAddFiles}
          disabled={disabled || isUploading}
        >
          <Plus width={16} height={16} color="#430B92" />
          <Text style={[styles.controlButtonText, styles.addMoreButtonText]}>Add More</Text>
        </TouchableOpacity>
      )}
      
      {uploadEndpoint && files.length > 0 && !autoUpload && (
        <TouchableOpacity
          style={[
            styles.controlButton,
            styles.uploadButton,
            (disabled || isUploading) && styles.uploadButtonDisabled
          ]}
          onPress={handleUpload}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Upload width={16} height={16} color="#FFFFFF" />
          )}
          <Text style={styles.uploadButtonText}>
            {isUploading ? 'Uploading...' : 'Upload Files'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle width={16} height={16} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
      
      {files.length === 0 ? renderUploadZone() : (
        <>
          {renderFileList()}
          {renderControls()}
        </>
      )}
      
      {files.length > 0 && !compact && (
        <View style={styles.summary}>
          <Text style={styles.summaryText}>
            {files.length} file{files.length > 1 ? 's' : ''} selected
            {files.length > 0 && ` • ${service.formatFileSize(files.reduce((sum, file) => sum + file.size, 0))} total`}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  containerCompact: {
    minHeight: 80,
  },
  uploadZone: {
    borderWidth: 2,
    borderColor: '#E2D0FB',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FEFEFE',
    minHeight: 160,
    justifyContent: 'center',
  },
  uploadZoneCompact: {
    padding: 16,
    minHeight: 80,
  },
  uploadZoneDragOver: {
    borderColor: '#430B92',
    backgroundColor: '#F0E7FD',
  },
  uploadZoneDisabled: {
    borderColor: '#D1D5DB',
    backgroundColor: '#F9FAFB',
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginTop: 12,
    textAlign: 'center',
  },
  uploadTitleCompact: {
    fontSize: 14,
    marginTop: 8,
  },
  uploadTitleDisabled: {
    color: '#9CA3AF',
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  uploadSubtitleDisabled: {
    color: '#D1D5DB',
  },
  uploadFormats: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
  },
  uploadFormatsDisabled: {
    color: '#D1D5DB',
  },
  uploadLimits: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    textAlign: 'center',
  },
  uploadLimitsDisabled: {
    color: '#D1D5DB',
  },
  fileList: {
    gap: 8,
  },
  fileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  fileItemCompact: {
    padding: 8,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  fileNameCompact: {
    fontSize: 12,
  },
  fileSize: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#430B92',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 10,
    color: '#6B7280',
    minWidth: 32,
  },
  fileActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  removeButton: {
    padding: 4,
  },
  controls: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    justifyContent: 'flex-end',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  clearButton: {
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
  },
  addMoreButton: {
    borderColor: '#430B92',
    backgroundColor: '#FFFFFF',
  },
  uploadButton: {
    borderColor: '#430B92',
    backgroundColor: '#430B92',
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  controlButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  addMoreButtonText: {
    color: '#430B92',
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  summary: {
    marginTop: 12,
    padding: 8,
    backgroundColor: '#F0E7FD',
    borderRadius: 6,
  },
  summaryText: {
    fontSize: 12,
    color: '#430B92',
    textAlign: 'center',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#EF4444',
  },
});