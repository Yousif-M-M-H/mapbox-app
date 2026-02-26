import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface PreemptionRequestPreviewModalProps {
  visible: boolean;
  endpoint: string;
  payload: Record<string, unknown> | null;
  onClose: () => void;
}

export const PreemptionRequestPreviewModal: React.FC<
  PreemptionRequestPreviewModalProps
> = ({ visible, endpoint, payload, onClose }) => {
  const payloadJson = payload ? JSON.stringify(payload, null, 2) : '{}';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Preemption POST Preview</Text>

          <Text style={styles.label}>Endpoint</Text>
          <Text style={styles.endpoint}>{endpoint}</Text>

          <Text style={styles.label}>Payload</Text>
          <ScrollView style={styles.payloadScroll} contentContainerStyle={styles.payloadContent}>
            <Text style={styles.payloadText}>{payloadJson}</Text>
          </ScrollView>

          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modal: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    maxHeight: '80%',
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
  },
  label: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 6,
  },
  endpoint: {
    color: '#e2e8f0',
    fontSize: 12,
    marginBottom: 10,
  },
  payloadScroll: {
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    backgroundColor: '#020617',
    minHeight: 160,
    maxHeight: 360,
  },
  payloadContent: {
    padding: 10,
  },
  payloadText: {
    color: '#e2e8f0',
    fontFamily: 'monospace',
    fontSize: 11,
    lineHeight: 16,
  },
  closeButton: {
    marginTop: 12,
    backgroundColor: '#1d4ed8',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
