import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  Alert,
  Image,
  Text,
  TouchableOpacity,
  View,
  ViewPropTypes,
  Platform,
  Modal,
  StyleSheet
} from 'react-native';
import { connect } from 'react-redux';
import FingerprintScanner from 'react-native-fingerprint-scanner';
import Style from './Style.js';
 
 
// - this example component supports both the
//   legacy device-specific (Android < v23) and
//   current (Android >= 23) biometric APIs
// - your lib and implementation may not need both
class BiometricPopup extends Component {
  constructor(props) {
    super(props);
    this.state = {
      errorMessageLegacy: undefined,
      biometricLegacy: undefined
    };
 
    this.description = null;
  }
 
  componentDidMount() {
    if (this.requiresLegacyAuthentication()) {
      this.authLegacy();
    } else {
      this.authCurrent();
    }
  }
 
  componentWillUnmount = () => {
    FingerprintScanner.release();
  }
 
  requiresLegacyAuthentication() {
    return Platform.Version < 23;
  }
 
  authCurrent() {
    const { setEnableFingerPrint } = this.props;
    FingerprintScanner
      .authenticate({ title: 'Proceed with FingerPrint' , description: "Scan your finger print on your device to continue", cancelButton: "CANCEL"})
      .then((res) => {
        console.log('[FINGER PRINT AUTHENTICATE]', res);
        this.props.onAuthenticate();
        this.props.handlePopupDismissedLegacy();
      })
      .catch(error => {
        this.props.handlePopupDismissedLegacy();
        if(error.message.includes('lockout')){
          Alert.alert(
            "Finger Print",
            error.message,
            [
              {
                text: "Cancel", 
                onPress: () => {},
                style: "cancel"
              },
              {
                text: "Confirm",
                onPress: () => setEnableFingerPrint(false)
              }
            ],
            {cancelable: false}
          )
        }else{
          setEnableFingerPrint(false)
        }
      });
  }
 
  authLegacy() {
    FingerprintScanner
      .authenticate({ onAttempt: this.handleAuthenticationAttemptedLegacy })
      .then((res) => {
        console.log("++++++++++++++++++++++", res);
        this.props.handlePopupDismissedLegacy();
        Alert.alert('Fingerprint Authentication', 'Authenticated successfully');
      })
      .catch((error) => {
        this.setState({ errorMessageLegacy: error.message, biometricLegacy: error.biometric });
        this.description.shake();
      });
  }
 
  handleAuthenticationAttemptedLegacy = (error) => {
    console.log(">>>>>>>>>>>>>>>>>>>>", error);
    this.setState({ errorMessageLegacy: error.message });
    this.description.shake();
  };
 
  renderLegacy() {
    const { errorMessageLegacy, biometricLegacy, hasError } = this.state;
    const { style, handlePopupDismissedLegacy } = this.props;
 
    return (
      <View style={Style.container}>
        <View style={[Style.contentContainer, style]}>
 
          {/* <Image
            style={Style.logo}
            source={require('./assets/finger_print.png')}
          /> */}
 
          <Text style={Style.heading}>
            Biometric{'\n'}Authentication
          </Text>
          <Text
            ref={(instance) => { this.description = instance; }}
            style={Style.description(!!errorMessageLegacy)}>
            {errorMessageLegacy || `Scan your ${biometricLegacy} on the\ndevice scanner to continue`}
          </Text>
 
          <TouchableOpacity
            style={Style.buttonContainer}
            onPress={handlePopupDismissedLegacy}
          >
            <Text style={Style.buttonText}>
              BACK TO MAIN
            </Text>
          </TouchableOpacity>
 
        </View>
      </View>
    );
  }
 

  render = () => {
    if (this.requiresLegacyAuthentication()) {
      return this.renderLegacy();
    }
    return null;
  }
}
 
BiometricPopup.propTypes = {
  onAuthenticate: PropTypes.func.isRequired,
  handlePopupDismissedLegacy: PropTypes.func,
  style: ViewPropTypes.style,
};

const mapStateToProps = state => ({ state: state });
const mapDispatchToProps = dispatch => {
  const { actions } = require('@redux');
  return {
    setEnableFingerPrint(isEnable){
      dispatch(actions.setEnableFingerPrint(isEnable));
    }
  }
}
export default connect(
  mapStateToProps,
  mapDispatchToProps
)(BiometricPopup);