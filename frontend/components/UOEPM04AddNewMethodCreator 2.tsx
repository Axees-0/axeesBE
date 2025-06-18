/**
 * Universal “Add New Payment Method” screen
 * apps/axees/components/UOEPM04AddNewMethodCreator.tsx
 *
 * ─ Structure ───────────────────────────────────────────────────────────────
 * 1.  Outer export   → wraps whole screen in <Elements> on web
 * 2.  InnerScreen    → real UI + logic (contains Stripe hooks)
 * 3.  CardWidget     → card field (web / native)
 * 4.  Small Input    → labelled TextInput helper
 * 5.  Styles
 */

import React, { useState } from 'react';
import {
  Text, StyleSheet, View, Pressable, SafeAreaView, Platform,
  useWindowDimensions, ScrollView, TextInput, KeyboardAvoidingView, Linking
} from 'react-native';
import Toast                from 'react-native-toast-message';
import { StatusBar }        from 'expo-status-bar';
import { useRouter }        from 'expo-router';
import axios, { AxiosError } from 'axios';
import { useAuth }          from '@/contexts/AuthContext';
import CustomBackButton     from '@/components/CustomBackButton';
import ProfileInfo          from './ProfileInfo';

/* ─── Stripe typings (removed at runtime on web) ────────────────────────── */
import type {
  CardField        as RNCardFieldType,
  CardFieldInput,
  createPaymentMethod as RNCreatePaymentMethodType,
  createToken         as RNCreateTokenType,
} from '@stripe/stripe-react-native';

/* ─── Stripe‑JS for web ─────────────────────────────────────────────────── */
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { StripeCardElement, loadStripe } from '@stripe/stripe-js';
import Navbar from './web/navbar';

/* Pull native SDK only for iOS / Android */
let CardField: RNCardFieldType | undefined;
let createPaymentMethod: RNCreatePaymentMethodType | undefined;
let createToken:          RNCreateTokenType          | undefined;

if (Platform.OS !== 'web') {
  const StripeRN = require('@stripe/stripe-react-native') as typeof import('@stripe/stripe-react-native');
  CardField           = StripeRN.CardField;
  createPaymentMethod = StripeRN.createPaymentMethod;
  createToken         = StripeRN.createToken;
}

/* Publishable key (env) */
const stripePromise = loadStripe(
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? 'pk_test_missing_key'
);

/* ─── Types & constants ─────────────────────────────────────────────────── */
interface CardInfo { cardHolderName: string }
interface BankFields {
  bankName: string; accountHolderName: string;
  routingNumber: string; accountNumber: string; postalCode: string;
}
const BREAKPOINTS = { TABLET: 768, DESKTOP: 1280 };

/* ╔══════════════════════════════════════════════════════════════════════╗
   ║ 1 ▸ OUTER EXPORT – adds <Elements> provider on web only             ║
   ╚══════════════════════════════════════════════════════════════════════╝ */
export default function UOEPM04AddNewMethodCreator() {
  const window = useWindowDimensions();
    const isWeb = Platform.OS === "web";
    const isWideScreen = window.width >= BREAKPOINTS.DESKTOP;
  if (Platform.OS === 'web') {
    /* web: Elements provider needed for useStripe/useElements */
    return (
      <Elements stripe={stripePromise}>
        <InnerAddPaymentScreen />
      </Elements>
    );
  }
  /* native */
  return <InnerAddPaymentScreen />;
}

/* ╔══════════════════════════════════════════════════════════════════════╗
   ║ 2 ▸ INNER SCREEN – all UI, hooks, validation, submission            ║
   ╚══════════════════════════════════════════════════════════════════════╝ */
   function InnerAddPaymentScreen() {
    const dimensions = useWindowDimensions();
    const isWeb = Platform.OS === 'web';
    const router = useRouter();
    const { user } = useAuth();
  
    /* Stripe hooks – safe here (Elements provider already exists on web) */
    const stripe = isWeb ? useStripe() : undefined;
    const elements = isWeb ? useElements() : undefined;
  
    /* ------- UI toggles ------------------------------- */
    const [showCard, setShowCard] = useState(true);
    const [showBank, setShowBank] = useState(false);
  
    /* ------- form state ------------------------------- */
    const [cardInfo, setCardInfo] = useState<CardInfo>({ cardHolderName: '' });
    const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
    const [bank, setBank] = useState<BankFields>({
      bankName: '',
      accountHolderName: '',
      routingNumber: '',
      accountNumber: '',
      postalCode: '',
    });
  
    /* ------- tiny helpers ----------------------------- */
    const onCardInput = (v: string) => setCardInfo({ cardHolderName: v });
    const onBankInput = (k: keyof BankFields, v: string) => setBank((p) => ({ ...p, [k]: v }));
    const digits = (s: string) => /^\d+$/.test(s);
  
    const cardReady = () =>
      !!cardInfo.cardHolderName.trim() && (isWeb || cardDetails?.complete);
  
    const bankReady = () =>
      !!(
        bank.bankName.trim() &&
        bank.accountHolderName.trim() &&
        digits(bank.routingNumber) &&
        digits(bank.accountNumber) &&
        digits(bank.postalCode)
      );
  
    /* ------- Parse query parameters for onboarding state ------- */
    let onboardingStatus: string | null = null;
    let connectIdFromQuery: string | null = null;
  
    if (isWeb) {
      const query = new URLSearchParams(
        typeof window !== 'undefined' && window.location ? window.location.search : ''
      );
      onboardingStatus = query.get('onboarding');
      connectIdFromQuery = query.get('connectId');
    } else {
      const queryObj = router.query || {};
      onboardingStatus = queryObj.onboarding || null;
      connectIdFromQuery = queryObj.connectId || null;
    }
  
    /* ------- Handle redirects from Stripe onboarding ------- */
    React.useEffect(() => {
      const handleOnboardingRedirect = async () => {
        if (onboardingStatus === 'refresh') {
          try {
            const { data: connectData } = await axios.post(
              `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/connect/onboard`,
              { userId: user?._id },
              { headers: { Authorization: `Bearer ${user?.token}` } }
            );
            const { url } = connectData;
            if (isWeb) {
              window.location.href = url;
            } else {
              router.push(url);
            }
          } catch (e) {
            Toast.show({
              type: 'error',
              text1: (e as AxiosError).response?.data?.error ?? 'Failed to refresh onboarding',
            });
          }
        } else if (onboardingStatus === 'complete' && connectIdFromQuery) {
          try {
            const { data: accountData } = await axios.get(
              `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/connect/verify/${connectIdFromQuery}`,
              { headers: { Authorization: `Bearer ${user?.token}` } }
            );
            if (accountData.details_submitted) {
              Toast.show({
                type: 'customNotification',
                text1: 'Success',
                text2: 'Onboarding completed successfully',
                position: 'top',
                visibilityTime: 3000,
              });
              if (isWeb) {
                window.history.replaceState({}, '', `${process.env.EXPO_PUBLIC_FRONTEND_URL}/UOEPM04AddNewMethodCreator`);
              } else {
                router.replace('/UOEPM04AddNewMethodCreator');
              }
            } else {
              Toast.show({
                type: 'error',
                text1: 'Onboarding incomplete',
              });
            }
          } catch (e) {
            Toast.show({
              type: 'error',
              text1: (e as AxiosError).response?.data?.error ?? 'Failed to verify onboarding',
            });
          }
        }
      };
  
      if (onboardingStatus) {
        handleOnboardingRedirect();
      }
    }, [onboardingStatus, connectIdFromQuery, user, router, isWeb]);

  /* ===================================================
     SUBMIT
     ===================================================*/
     const handleAdd = async () => {
      if (showCard && !cardReady()) {
        Toast.show({
          type: 'customNotification',
          text1: 'error',
          text2: 'Please complete card details',
          position: 'top',
          visibilityTime: 3000,
        });
        return;
      }
      if (showBank && !bankReady()) {
        Toast.show({
          type: 'customNotification',
          text1: 'error',
          text2: 'Please complete bank details',
          position: 'top',
          visibilityTime: 3000,
        });
        return;
      }
  
      let paymentMethodId: string | undefined;
      const isBankAccount = showBank;
  
      if (showCard) {
        if (isWeb) {
          if (!stripe || !elements) {
            Toast.show({ type: 'error', text1: 'Stripe not ready' });
            return;
          }
  
          const cardElement = elements.getElement(CardElement) as StripeCardElement | null;
          if (!cardElement) {
            Toast.show({ type: 'error', text1: 'Card field not found' });
            return;
          }
  
          const { error: tokenErr, token } = await stripe.createToken(cardElement);
          if (tokenErr) {
            Toast.show({ type: 'error', text1: tokenErr.message! });
            return;
          }
          paymentMethodId = token!.id;
        } else if (createPaymentMethod) {
          const { error, paymentMethod } = await createPaymentMethod({
            paymentMethodType: 'Card',
            card: cardDetails!,
            billingDetails: { name: cardInfo.cardHolderName },
          });
          if (error) {
            Toast.show({ type: 'error', text1: error.message });
            return;
          }
          paymentMethodId = paymentMethod!.id;
        }
      }
  
      if (showBank) {
        if (isWeb) {
          const { error, token } = await stripe!.createToken('bank_account', {
            country: 'US',
            currency: 'usd',
            routing_number: bank.routingNumber,
            account_number: bank.accountNumber,
            account_holder_name: bank.accountHolderName,
            account_holder_type: 'individual',
          });
          if (error || !token) {
            Toast.show({ type: 'error', text1: error?.message ?? 'Bank token failed' });
            return;
          }
          paymentMethodId = token.id;
        } else if (createToken) {
          const { error, token } = await createToken({
            bank_account: {
              country: 'US',
              currency: 'usd',
              routing_number: bank.routingNumber,
              account_number: bank.accountNumber,
              account_holder_name: bank.accountHolderName,
            },
          });
          if (error || !token) {
            Toast.show({ type: 'error', text1: error?.message ?? 'Bank token failed' });
            return;
          }
          paymentMethodId = token.id;
        }
      }
  
      if (!paymentMethodId) {
        Toast.show({ type: 'error', text1: 'Could not obtain paymentMethodId' });
        return;
      }
  
      try {
        const { data: connectData } = await axios.post(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/connect/onboard?userId=${user?._id}`,
          { userId: user?._id },
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
        const { connectId, url } = connectData;
  
        const { data: accountData } = await axios.get(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/connect/verify/${connectId}?userId=${user?._id}`,
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
  
        if (!accountData.details_submitted) {
          // Construct the return_url and refresh_url
          const returnUrl = `${process.env.EXPO_PUBLIC_FRONTEND_URL}/UOEPM04AddNewMethodCreator?onboarding=complete&connectId=${connectId}`;
          const refreshUrl = `${process.env.EXPO_PUBLIC_FRONTEND_URL}/UOEPM04AddNewMethodCreator?onboarding=refresh`;
        
          // URL-encode the return_url and refresh_url
          // const encodedReturnUrl = encodeURIComponent(returnUrl);
          // const encodedRefreshUrl = encodeURIComponent(refreshUrl);
          const encodedReturnUrl = returnUrl;
          const encodedRefreshUrl = refreshUrl;
        
          // Construct the redirectUrl with encoded parameters
          const redirectUrl = `${url}&return_url=${encodedReturnUrl}&refresh_url=${encodedRefreshUrl}`;
          console.log('Redirect URL:', redirectUrl); // Debug log
        
          if (isWeb) {
            window.location.href = redirectUrl;
          } else {
            Linking.openURL(redirectUrl).catch((err) =>
              console.error('Failed to open URL:', err)
            );
          }
          return;
        }
  
        const postResponse = await axios.post(
          `${process.env.EXPO_PUBLIC_BACKEND_URL}/api/payments/paymentmethod`,
          {
            paymentMethodId,
            userId: user?._id,
            stripeConnectId: connectId,
            isBankAccount,
            isPayoutCard: showCard,
          },
          { headers: { Authorization: `Bearer ${user?.token}` } }
        );
  
        if (postResponse) {
          Toast.show({
            type: 'customNotification',
            text1: 'Success',
            text2: 'Payment Method Saved Successfully',
            position: 'top',
            visibilityTime: 3000,
          });
        }
  
        router.push('/UOEPM02WithdrawMoneyCreator');
      } catch (e) {
        Toast.show({
          type: 'error',
          text1: (e as AxiosError).response?.data?.error ?? 'Save failed',
        });
      }
    };

  /* ===================================================
     RENDER
     ===================================================*/
     return (
      <>
      <Navbar pageTitle='Add New'/>
      <SafeAreaView style={styles.outer}>
        
        <StatusBar style="auto" />
        <View style={[isWeb && styles.webContainer]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.inner, isWeb && dimensions.width >= BREAKPOINTS.TABLET && styles.innerWeb]}
        >
          {/* <View style={styles.header}>
            <CustomBackButton />
            <Text style={styles.headerTitle}>Add New</Text>
            <ProfileInfo />
          </View> */}
  
          <ScrollView style={styles.content}>
            <Pressable onPress={() => { setShowCard(!showCard); if (!showCard) setShowBank(false); }}>
              <Text style={styles.toggle}>
                {showCard ? 'Hide' : 'Show'} Debit/Credit Card Details
              </Text>
            </Pressable>
  
            {showCard && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Debit / Credit Card Details</Text>
                <Input
                  label="Cardholder Name"
                  value={cardInfo.cardHolderName}
                  onChange={onCardInput}
                />
                <View style={{ marginTop: 16 }}>
                  <Text style={styles.label}>Card Number</Text>
                  {isWeb ? (
                    <CardWidget onChange={setCardDetails} />
                  ) : (
                    CardField && <CardWidget onChange={setCardDetails} />
                  )}
                </View>
              </View>
            )}
  
            <Pressable onPress={() => { setShowBank(!showBank); if (!showBank) setShowCard(false); }}>
              <Text style={styles.toggle}>{showBank ? 'Hide' : 'Show'} Bank Details</Text>
            </Pressable>
  
            {showBank && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Bank Details</Text>
                <Input
                  label="Bank Name"
                  value={bank.bankName}
                  onChange={(v) => onBankInput('bankName', v)}
                />
                <Input
                  label="Account holder Name"
                  value={bank.accountHolderName}
                  onChange={(v) => onBankInput('accountHolderName', v)}
                />
                <View style={styles.row}>
                  <Input
                    flex
                    label="Routing Number"
                    value={bank.routingNumber}
                    onChange={(v) => onBankInput('routingNumber', v)}
                  />
                  <Input
                    flex
                    label="Account Number"
                    value={bank.accountNumber}
                    onChange={(v) => onBankInput('accountNumber', v)}
                  />
                </View>
                <Input
                  label="Postal Code"
                  value={bank.postalCode}
                  onChange={(v) => onBankInput('postalCode', v)}
                />
              </View>
            )}
          </ScrollView>
  
          <Pressable style={styles.cta} onPress={handleAdd}>
            <Text style={styles.ctaText}>Add Payment Method</Text>
          </Pressable>
        </KeyboardAvoidingView>
        </View>
      </SafeAreaView>
      </>
    );
  }

/* ╔══════════════════════════════════════════════════════════════════════╗
   ║ 3 ▸ CardWidget helper (already declared above)                       ║
   ╚══════════════════════════════════════════════════════════════════════╝ */
function CardWidget({ onChange }: { onChange:(d:CardFieldInput.Details|null)=>void }) {
  if (Platform.OS === 'web') {
    return (
      <div style={{ width:'100%',padding:12,border:'1px solid #E2D0FB',borderRadius:8 }}>
        <CardElement options={{ style:{ base:{ fontSize:'16px',color:'#000' } } }} />
      </div>
    );
  }
  return CardField
    ? <CardField
        postalCodeEnabled
        placeholders={{ number:'4562 3653 4595 7852' }}
        style={{ width:'100%',height:58 }}
        onCardChange={onChange}/>
    : null;
}

/* ╔══════════════════════════════════════════════════════════════════════╗
   ║ 4 ▸ tiny labelled input helper                                       ║
   ╚══════════════════════════════════════════════════════════════════════╝ */
function Input({ label,value,onChange,flex }: {
  label:string; value:string; onChange:(t:string)=>void; flex?:boolean;
}) {
  return (
    <View style={[styles.inputGroup, flex&&{ flex:1 }]}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.textInput}
        placeholder={label}
        placeholderTextColor="#6C6C6C"
        value={value}
        onChangeText={onChange}
        keyboardType={/Number|Routing|Account|Postal/i.test(label)?'number-pad':'default'}
      />
    </View>
  );
}

/* ╔══════════════════════════════════════════════════════════════════════╗
   ║ 5 ▸ Styles                                                           ║
   ╚══════════════════════════════════════════════════════════════════════╝ */
const styles = StyleSheet.create({
  outer:{ flex:1,backgroundColor:'#fff' },
  webContainer: {
    maxWidth: BREAKPOINTS.DESKTOP,
     marginHorizontal: "auto",
    paddingHorizontal:'15%',
    marginTop:"2.5%",
    width: "100%",
  },
  inner:{ flex:1 },
  innerWeb:{ alignSelf:'center',width:'100%',maxWidth:BREAKPOINTS.DESKTOP },

  header:{ flexDirection:'row',justifyContent:'space-between',alignItems:'center',
           paddingHorizontal:32,paddingTop: Platform.OS==='ios'?20:24,paddingBottom:20 },
  headerTitle:{ fontSize:24,fontWeight:'600',color:'#000' },

  content:{ flex:1,paddingHorizontal:32 },
  section:{ marginBottom:40 },
  sectionTitle:{ fontSize:24,fontWeight:'500',color:'#000',marginBottom:24 },

  inputGroup:{ marginBottom:16 },
  row:{ flexDirection:'row',gap:16 },
  label:{ fontSize:14,color:'#6C6C6C',marginBottom:6 },
  textInput:{ borderWidth:1,borderColor:'#E2D0FB',borderRadius:8,
              paddingHorizontal:16,height:48,fontSize:16,color:'#000' },

  toggle:{ fontSize:16,fontWeight:'500',color:'#430B92',textDecorationLine:'underline',marginBottom:10 },

  cta:{ backgroundColor:'#430B92',borderRadius:8,height:58,
        justifyContent:'center',alignItems:'center',margin:32 },
  ctaText:{ color:'#fff',fontSize:18,fontWeight:'500' },
});
