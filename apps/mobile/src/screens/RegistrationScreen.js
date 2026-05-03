import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  HelperText,
  Menu,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const SPECIALIZATIONS = [
  'General Medicine',
  'Pediatrics',
  'Cardiology',
  'Dermatology',
  'Orthopedics',
  'Neurology',
  'Gynecology',
  'ENT',
  'Ophthalmology',
  'Psychiatry',
  'Dentistry',
  'Counseling',
];

const validate = (role, f) => {
  const e = {};

  if (!f.name.trim()) e.name = 'Name is required';

  if (!f.email.trim()) {
    e.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) {
    e.email = 'Enter a valid email address';
  }

  if (!f.password) {
    e.password = 'Password is required';
  } else if (f.password.length < 6) {
    e.password = 'Password must be at least 6 characters';
  }

  if (!f.contactNumber.trim()) {
    e.contactNumber = 'Contact number is required';
  } else if (!/^\+?[0-9]{7,15}$/.test(f.contactNumber.replace(/[\s\-()]/g, ''))) {
    e.contactNumber = 'Enter a valid phone number (7–15 digits)';
  }

  if (role === 'patient') {
    if (!f.age.trim()) {
      e.age = 'Age is required';
    } else {
      const n = parseInt(f.age, 10);
      if (isNaN(n) || n < 1 || n > 150) e.age = 'Enter a valid age (1–150)';
    }
    if (!f.gender) e.gender = 'Please select a gender';
  }

  if (role === 'doctor') {
    if (!f.specialization) e.specialization = 'Please select a specialization';
    if (!f.qualification.trim()) e.qualification = 'Qualification is required';
  }

  return e;
};

const RegistrationScreen = ({ navigation }) => {
  const { register } = useAuth();

  const [role, setRole] = useState('patient');
  const [submitting, setSubmitting] = useState(false);
  const [specMenuVisible, setSpecMenuVisible] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [errors, setErrors] = useState({});

  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');

  // Patient-only
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [address, setAddress] = useState('');

  // Doctor-only
  const [photoUrl, setPhotoUrl] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [qualification, setQualification] = useState('');

  const err = (key) => errors[key] || '';

  const switchRole = (r) => {
    setRole(r);
    setErrors({});
    setSubmitError('');
  };

  const handleSubmit = async () => {
    const fields = {
      name, email, password, contactNumber,
      age, gender,
      specialization, qualification,
    };
    const validationErrors = validate(role, fields);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setSubmitError('');
    setSubmitting(true);

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        contactNumber: contactNumber.trim(),
        ...(role === 'patient' && {
          age: parseInt(age, 10),
          gender,
          address: address.trim(),
        }),
      });

      if (role === 'doctor') {
        await api.patch('/profile', {
          name: name.trim(),
          specialty: specialization,
          contactNumber: contactNumber.trim(),
          qualification: qualification.trim(),
          ...(photoUrl.trim() && { photoUrl: photoUrl.trim() }),
        });
      }
      // AuthContext token change triggers RootNavigator to switch to AppStack
    } catch (e) {
      setSubmitError(e?.response?.data?.message || e?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium" style={styles.title}>
          Create Account
        </Text>

        {/* ── Role toggle ── */}
        <View style={styles.roleRow}>
          <Button
            mode={role === 'patient' ? 'contained' : 'outlined'}
            onPress={() => switchRole('patient')}
            style={styles.roleBtn}
            testID="btn-register-user"
          >
            Register as User
          </Button>
          <Button
            mode={role === 'doctor' ? 'contained' : 'outlined'}
            onPress={() => switchRole('doctor')}
            style={styles.roleBtn}
            testID="btn-register-doctor"
          >
            Register as Doctor
          </Button>
        </View>

        {/* ── Common fields ── */}
        <TextInput
          label="Full Name"
          mode="outlined"
          value={name}
          onChangeText={setName}
          error={!!err('name')}
          style={styles.input}
          testID="input-name"
        />
        <HelperText type="error" visible={!!err('name')}>{err('name')}</HelperText>

        <TextInput
          label="Email"
          mode="outlined"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          error={!!err('email')}
          style={styles.input}
          testID="input-email"
        />
        <HelperText type="error" visible={!!err('email')}>{err('email')}</HelperText>

        <TextInput
          label="Password"
          mode="outlined"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!passwordVisible}
          right={
            <TextInput.Icon
              icon={passwordVisible ? 'eye-off' : 'eye'}
              onPress={() => setPasswordVisible((v) => !v)}
            />
          }
          error={!!err('password')}
          style={styles.input}
          testID="input-password"
        />
        <HelperText type="error" visible={!!err('password')}>{err('password')}</HelperText>

        <TextInput
          label="Contact Number"
          mode="outlined"
          value={contactNumber}
          onChangeText={setContactNumber}
          keyboardType="phone-pad"
          error={!!err('contactNumber')}
          style={styles.input}
          testID="input-contact"
        />
        <HelperText type="error" visible={!!err('contactNumber')}>{err('contactNumber')}</HelperText>

        {/* ── Patient-specific fields ── */}
        {role === 'patient' && (
          <>
            <TextInput
              label="Age"
              mode="outlined"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
              error={!!err('age')}
              style={styles.input}
              testID="input-age"
            />
            <HelperText type="error" visible={!!err('age')}>{err('age')}</HelperText>

            <Text variant="labelLarge" style={styles.sectionLabel}>Gender</Text>
            <SegmentedButtons
              value={gender}
              onValueChange={setGender}
              buttons={[
                { value: 'Male', label: 'Male' },
                { value: 'Female', label: 'Female' },
                { value: 'Other', label: 'Other' },
              ]}
              style={styles.segmented}
            />
            <HelperText type="error" visible={!!err('gender')}>{err('gender')}</HelperText>

            <TextInput
              label="Address"
              mode="outlined"
              value={address}
              onChangeText={setAddress}
              multiline
              numberOfLines={2}
              style={styles.input}
              testID="input-address"
            />
            <HelperText type="info" visible>Optional — saved to your profile</HelperText>
          </>
        )}

        {/* ── Doctor-specific fields ── */}
        {role === 'doctor' && (
          <>
            <TextInput
              label="Profile Photo URL (optional)"
              mode="outlined"
              value={photoUrl}
              onChangeText={setPhotoUrl}
              autoCapitalize="none"
              style={styles.input}
              testID="input-photo"
            />
            <HelperText type="info" visible>Image upload can be added later</HelperText>

            <Text variant="labelLarge" style={styles.sectionLabel}>Field of Specialization</Text>
            <Menu
              visible={specMenuVisible}
              onDismiss={() => setSpecMenuVisible(false)}
              anchor={
                <Button
                  mode="outlined"
                  onPress={() => setSpecMenuVisible(true)}
                  icon="chevron-down"
                  contentStyle={styles.pickerContent}
                  style={[
                    styles.pickerBtn,
                    !!err('specialization') && styles.pickerBtnError,
                  ]}
                  testID="btn-specialization"
                >
                  {specialization || 'Select specialization'}
                </Button>
              }
            >
              {SPECIALIZATIONS.map((s) => (
                <Menu.Item
                  key={s}
                  title={s}
                  onPress={() => {
                    setSpecialization(s);
                    setSpecMenuVisible(false);
                  }}
                />
              ))}
            </Menu>
            <HelperText type="error" visible={!!err('specialization')}>
              {err('specialization')}
            </HelperText>

            <TextInput
              label="Qualification (e.g., MBBS, MD, Counselor)"
              mode="outlined"
              value={qualification}
              onChangeText={setQualification}
              error={!!err('qualification')}
              style={styles.input}
              testID="input-qualification"
            />
            <HelperText type="error" visible={!!err('qualification')}>
              {err('qualification')}
            </HelperText>
          </>
        )}

        {/* ── Submit error banner ── */}
        {!!submitError && (
          <HelperText type="error" visible style={styles.submitError}>
            {submitError}
          </HelperText>
        )}

        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={submitting}
          style={styles.submitBtn}
          contentStyle={styles.submitBtnContent}
          testID="btn-submit"
        >
          {submitting
            ? <ActivityIndicator color="#fff" size="small" />
            : 'Create Account'}
        </Button>

        <Button
          mode="text"
          onPress={() => navigation.navigate('Login')}
          style={styles.loginLink}
        >
          Already have an account? Login
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { backgroundColor: '#fff' },
  container: { padding: 24, paddingBottom: 48 },
  title: {
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '700',
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
  },
  roleBtn: { flex: 1 },
  input: { marginBottom: 0 },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 6,
    color: '#374151',
  },
  segmented: { marginBottom: 0 },
  pickerBtn: { alignSelf: 'stretch', marginBottom: 0 },
  pickerBtnError: { borderColor: '#ef4444' },
  pickerContent: { flexDirection: 'row-reverse', justifyContent: 'space-between' },
  submitError: { fontSize: 14 },
  submitBtn: { marginTop: 16 },
  submitBtnContent: { paddingVertical: 6 },
  loginLink: { marginTop: 12 },
});

export default RegistrationScreen;
