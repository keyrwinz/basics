import React, { Component } from 'react';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import { View , TextInput, Text, ScrollView, TouchableOpacity, Dimensions, SafeAreaView, Linking} from 'react-native';
import Style from './../Style.js';
import { Spinner } from 'components';
import PasswordWithIcon from 'components/InputField/Password.js';
import CustomError from 'components/Modal/Error.js';
import Api from 'services/api/index.js';
import { Routes, Color, Helper, BasicStyles } from 'common';
import Header from './../HeaderWithoutName';
import config from 'src/config';
import OtpModal from 'components/Modal/Otp.js';
import { fcmService } from 'services/broadcasting/FCMService';
import { localNotificationService } from 'services/broadcasting/LocalNotificationService';
import FingerPrintScanner from './../FingerPrintScanner'
import { Alert } from 'react-native';
import Button from 'components/Form/Button';
import NetInfo from "@react-native-community/netinfo";
import NotificationsHandler from 'services/NotificationHandler';
const height = Math.round(Dimensions.get('window').height);
class Login extends Component {
  constructor(props){
    super(props);
    this.notificationHandler = React.createRef();
    this.state = {
      username: null,
      password: null,
      isLoading: false,
      token: null,
      error: 0,
      isResponseError: false,
      isOtpModal: false,
      blockedFlag: false,
      notifications: [],
      visible: false,
      showFingerPrint: false,
      notEmpty: false,
      isConfirmed: false,
      enable: false,
      isConnected: false
    };
    this.audio = null;
  }

  onRegister = () => {
    this.notificationHandler.onRegister();
  };

  onOpenNotification = (notify) => {
    this.notificationHandler.onOpenNotification(notify);
  };

  onNotification = (notify) => {
    this.notificationHandler.onNotification(notify);
  };

  checkInternetConnection(){
    NetInfo.addEventListener(networkState => {
      if(networkState.isConnected == false){
        this.setState({isResponseError: true, isLoading: false})
      }
      this.setState({isConnected: networkState.isConnected == true ? true : false})
    });
  }

  async storageChecker(){
    if((await AsyncStorage.getItem('username') != null && await AsyncStorage.getItem('password') != null)){
      await this.setState({showFingerPrint: true})
      await this.setState({notEmpty: true})
    }else{
      await this.setState({notEmpty: false})
      await this.setState({showFingerPrint: false})
    }
  }

  onFocusFunction = () => {
    Linking.getInitialURL().then(url => {
      this.navigate(url);
    });
    Linking.addEventListener('url', this.handleOpenURL);
  }
  
  async componentDidMount(){
    this.getTheme()
    this.focusListener = this.props.navigation.addListener('didFocus', () => {
      this.onFocusFunction()
    })
    if((await AsyncStorage.getItem('username') != null && await AsyncStorage.getItem('password') != null)){
      await this.setState({showFingerPrint: true})
      await this.setState({notEmpty: true})
    }

    this.getData();
    this.checkInternetConnection();

    Linking.getInitialURL().then(url => {
      this.navigate(url);
    });
    Linking.addEventListener('url', this.handleOpenURL);
  }

  componentWillUnmount() {
    this.focusListener.remove()
    Linking.removeEventListener('url', this.handleOpenURL);
  }
  
  
  handleOpenURL = (event) => { // D
    this.navigate(event.url);
  }
  navigate = (url) => { // E
    const { navigate } = this.props.navigation;
    if(url !== null){
      const route = url.replace(/.*?:\/\//g, '');
      const routeName = route.split('/')[0];
      if (routeName === 'payhiram.ph' || 'admin.payhiram.ph')
      {

        console.log('ROUTE: ', route.split('/')[2])
        // console.log('/.....1stIF.......')
        if(route.split('/')[2] === 'profile') {
          // console.log('/.....2ndIF.......')
          const {setDeepLinkRoute} = this.props;
          setDeepLinkRoute(route);
        }else if(route.split('/')[2] === 'reset_password') {
          const {viewChangePass} = this.props;
          viewChangePass(1);
          this.props.navigation.navigate('forgotPasswordStack')
        }else if(route.split('/')[2] === 'login_verification') {
          this.props.navigation.navigate('verifyEmailStack', {
            username: route.split('/')[3],
            code: route.split('/')[4]
          })
        }
      };
    }
  }

  getTheme = async () => {
    try {
      const primary = await AsyncStorage.getItem(Helper.APP_NAME + 'primary');
      const secondary = await AsyncStorage.getItem(Helper.APP_NAME + 'secondary');
      const tertiary = await AsyncStorage.getItem(Helper.APP_NAME + 'tertiary');
      const fourth = await AsyncStorage.getItem(Helper.APP_NAME + 'fourth');
      if(primary != null && secondary != null && tertiary != null) {
        const { setTheme } = this.props;
        setTheme({
          primary: primary,
          secondary: secondary,
          tertiary: tertiary,
          fourth: fourth
        })
      }
    } catch (e) {
      console.log(e)
    }
  }


  async onPressFingerPrint(username, password){
    if((await AsyncStorage.getItem('username') != null && await AsyncStorage.getItem('password') != null)){
      await this.setState({showFingerPrint: true})
      await this.setState({notEmpty: true})
      await this.setState({username: await AsyncStorage.getItem('username')})
      await this.setState({password: await AsyncStorage.getItem('password')})
      this.login()
    }else{
      await this.setState({notEmpty: false})
      await this.setState({showFingerPrint: false})
    }
    this.infocus = this.props.navigation.addListener('didfocus', () => {
      this.storageChecker()
    })
  }


  test = () => {
    if(config.TEST == true){
      this.props.navigation.navigate('drawerStack');
      return true;
    }
  }

  redirect = (route) => {
    this.props.navigation.navigate(route);
  }

  playAudio = () => {
    if(this.audio){
      this.audio.play();
    }
  }

  firebaseNotification(){
    const { user } = this.props.state;
    if(user == null){
      return
    }
    fcmService.registerAppWithFCM()
    fcmService.register(this.onRegister, this.onNotification, this.onOpenNotification)
    localNotificationService.configure(this.onOpenNotification, Helper.APP_NAME)
    fcmService.subscribeTopic(user.id)
    this.retrieveNotification()
    return () => {
      console.log("[App] unRegister")
      fcmService.unRegister()
      localNotificationService.unRegister()
    }
  }

  retrieveNotification = () => {
    const { setNotifications } = this.props;
    const { user } = this.props.state;
    if(user == null){
      return
    }
    let parameter = {
      condition: [{
        value: user.id,
        clause: '=',
        column: 'to'
      }],
      limit: 10,
      offset: 0
    }
    Api.request(Routes.notificationsRetrieve, parameter, notifications => {
      setNotifications(notifications.size, notifications.data)
    }, error => {
    })
  }

  login = () => {
    // this.test();
    const { login } = this.props;
    if(this.state.token != null){
      this.setState({isLoading: true});
      Api.getAuthUser(this.state.token, (response) => {
        login(response, this.state.token);
        this.setState({isLoading: false});
        if(response.username){
          this.firebaseNotification()
          this.redirect('drawerStack')
        }
      }, error => {
        this.setState({isResponseError: true})
      })
    }
  }

  getData = async () => {
    try {
      const token = await AsyncStorage.getItem(Helper.APP_NAME + 'token');
      if(token != null && token != '') {
        this.setState({token});
        this.login();
      }
    } catch(e) {
      // error reading value
    }
  }
  
  checkOtp = () => {
    const { user } = this.props.state;
    if(user.notification_settings != null){
      let nSettings = user.notification_settings
      if(parseInt(nSettings.email_otp) == 1 || parseInt(nSettings.sms_otp) == 1){
        this.setState({
          isOtpModal: true,
          blockedFlag: false
        })
        return
      }
    }
    this.props.navigation.navigate('drawerStack');
  }

  onSuccessOtp = () => {
    this.setState({isOtpModal: false})
    this.props.navigation.navigate('drawerStack');
  }

  accountRetrieve(parameter){
    
  }

  async confirm(username, password){
      const { setEnableFingerPrint } = this.props;
      const {enable} = this.state
      await this.setState({enable : !enable})
      await AsyncStorage.setItem('username', username)
      await AsyncStorage.setItem('password', password)
      setEnableFingerPrint(enable);
      this.setState({showFingerPrint: true})
  }

  async cancel(){
    await this.setState({showFingerPrint: false})
  }

  openModal(username, password){
    Alert.alert(
      "Finger Print",
      "Allow access to your finger print?",
      [
        {
          text: "Cancel", 
          onPress: () => this.cancel(),
          style: "cancel"
        },
        {
          text: "Allow",
          onPress: () => this.confirm(username, password)
        }
      ],
      {cancelable: false}
    )
  }
  handleFingerPrintSubmit(username, password){
    const { login } = this.props;
    this.setState({isLoading: true, error: 0});
      Api.authenticate(username, password, (response) => {
        if(response.error){
          this.setState({error: 2, isLoading: false});
        }
        if(response.token){
          const token = response.token;
          Api.getAuthUser(response.token, (response) => {
            login(response, token);
            this.setState({isLoading: false, error: 0});
            if(response.username){
              this.firebaseNotification()
              this.redirect('drawerStack')
            }
            
          }, error => {
            console.log("[ERROR]", error);
            this.setState({isResponseError: true, isLoading: false})
          })
        }
      }, error => {
        console.log('error', error)
        this.setState({isResponseError: true, isLoading: false})
        this.setState({showFingerPrint: false})
      })
  }
  submit(){
    this.test();
    const { username, password } = this.state;
    const { login } = this.props;
    if(username == null || username == '' || password == null || password == ''){
      this.setState({
        error: 1
      })
      return
    }
    if((username != null && username != '') && (password != null && password != '')){
      this.setState({isLoading: true, error: 0});
      Api.authenticate(username, password, (response) => {
        if(response.error){
          this.setState({error: 2, isLoading: false});
        }
        if(response.token){
          const token = response.token;
          Api.getAuthUser(response.token, (response) => {
            login(response, token);
            console.log("[NOT_EMPTY]", this.state.notEmpty)
            this.setState({isLoading: false, error: 0});
            if(this.state.notEmpty == true){
              console.log("[notEmpty]", this.state.notEmpty);
            }else{
              this.openModal(username, password);
            }
            if(response.username){
              this.firebaseNotification()
              this.redirect('drawerStack')
            }
            
          }, error => {
            this.setState({isResponseError: true, isLoading: false})
          })
        }
      }, error => {
        console.log('error', error)
        this.setState({isResponseError: true, isLoading: false})
        this.setState({showFingerPrint: false})
      })
      // this.props.navigation.navigate('drawerStack');
    }else{
      this.setState({error: 1, isLoading: false});
    }
  }

  render() {
    const { isLoading, error, isResponseError } = this.state;
    const {  blockedFlag, isOtpModal } = this.state;
    const { theme } = this.props.state;
    return (
      <SafeAreaView>
        <ScrollView
          style={{
            backgroundColor: theme ? theme.primary : Color.primary
          }}
          showsVerticalScrollIndicator={false}>
          <View style={{
            flex: 1,
          }}>
            
            <NotificationsHandler notificationHandler={ref => (this.notificationHandler = ref)} />
            <Header params={"Login"} textColor={{color: Color.white}}></Header>
            <View style={{
              backgroundColor: Color.white,
              width: '100%',
              paddingTop: 50,
              marginTop: 10,
              borderTopLeftRadius: 60,
              borderTopRightRadius: 60,
              height: height,
              ...BasicStyles.loginShadow
            }}>
              <Text style={{
                width: '100%',
                textAlign: 'center',
                paddingBottom: 20,
                fontSize: BasicStyles.standardFontSize,
                fontWeight: 'bold',
                color: theme ? theme.primary : Color.primary
              }}>Login to {Helper.APP_NAME_BASIC}</Text>
              {error > 0 ? <View style={{
                ...Style.messageContainer
              }}>
                {error == 1 ? (
                  <Text style={{
                    ...Style.messageText,
                    fontSize: BasicStyles.standardFontSize
                  }}>Please fill up the required fields.</Text>
                ) : null}

                {error == 2 ? (
                  <Text style={{
                    ...Style.messageText,
                    fontSize: BasicStyles.standardFontSize
                  }}>Username and password didn't match.</Text>
                ) : null}
              </View> : null}
              
              <View style={Style.TextContainerRounded}>
                <TextInput
                  style={{
                    ...BasicStyles.standardFormControl,
                    marginBottom: 20,
                    borderRadius: 25
                  }}
                  onChangeText={(username) => this.setState({username})}
                  value={this.state.username}
                  placeholder={'Username or Email'}
                />

                <PasswordWithIcon
                  onTyping={(input) => this.setState({
                    password: input
                  })}
                  style={{
                    borderRadius: 25
                  }}
                  />


                <View style={{
                  width: '100%',
                  marginTop: 20,
                  minHeight: 50
                }}>
                {
                  this.state.showFingerPrint == true && (
                    <FingerPrintScanner navigate={() => this.redirect('drawerStack')} login={() => this.onPressFingerPrint(null, null)} onSubmit={(username, password)=>this.handleFingerPrintSubmit(username, password)}/>
                  )
                }
                </View>

                <Button
                  onClick={() => this.submit()}
                  title={'Login'}
                  style={{
                    backgroundColor: theme ? theme.secondary : Color.secondary,
                    width: '100%',
                    marginBottom: 20,
                    borderRadius: 25
                  }}
                />

                {/* <Confirm visible={this.state.visible} message={'Do you want to enable finger print scanning for easier login?'}
                    onConfirm={() => {
                        this.openModal(this.state.username, this.state.password)
                    }}
                    onCLose={() => {
                        this.setState({visible: false})
                    }}
                /> */}

               {/*<Button
                   onClick={() => this.redirect('forgotPasswordStack')}
                   title={'Forgot your Password?'}
                   style={{
                     backgroundColor: Color.warning,
                     width: '100%',
                     marginBottom: 20,
                     borderRadius: 25
                   }}
                 />*/}
                 <TouchableOpacity
                  onPress={() => {
                    this.redirect('forgotPasswordStack')
                  }}>
                    <Text style={{
                      width: '100%',
                      textAlign: 'center',
                      paddingBottom: 20,
                      fontSize: BasicStyles.standardFontSize,
                      fontWeight: 'bold',
                      color: theme ? theme.primary : Color.primary,
                      textDecorationLine: 'underline'
                    }}>Forgot your Password?</Text>
                 </TouchableOpacity>
                  

                <Text style={{
                  width: '100%',
                  textAlign: 'center',
                  paddingBottom: 10,
                  fontSize: BasicStyles.standardFontSize,
                  fontWeight: 'bold',
                  color: theme ? theme.primary : Color.primary
                }}>OR</Text>
                <View style={{
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Text style={{
                    paddingTop: 10,
                    paddingBottom: 20,
                    fontSize: BasicStyles.standardFontSize,
                    fontWeight: 'bold',
                    color: theme ? theme.primary : Color.primary
                  }}>Don't have an account?</Text>
                </View>

                <Button
                  onClick={() => this.redirect('registerStack')}
                  title={'Register Now!'}
                  style={{
                    backgroundColor: Color.warning,
                    width: '100%',
                    marginBottom: 100,
                    borderRadius: 25
                  }}
                />

              </View>
            </View>
          </View>

        </ScrollView>
        <OtpModal
          visible={isOtpModal}
          title={blockedFlag == false ? 'Authentication via OTP' : 'Blocked Account'}
          actionLabel={{
            yes: 'Authenticate',
            no: 'Cancel'
          }}
          onCancel={() => this.setState({isOtpModal: false})}
          onSuccess={() => this.onSuccessOtp()}
          onResend={() => {
            this.setState({isOtpModal: false})
            this.submit()
          }}
          error={''}
          blockedFlag={blockedFlag}
        ></OtpModal>

        {isLoading ? <Spinner mode="overlay"/> : null }
        {isResponseError ? <CustomError visible={isResponseError} message={this.state.isConnected == true ? 'You have no internet connection' : null}
        onCLose={() => {
          this.setState({isResponseError: false, isLoading: false})
        }}/> : null}
      </SafeAreaView>
    );
  }
}
 
const mapStateToProps = state => ({ state: state });

const mapDispatchToProps = dispatch => {
  const { actions } = require('@redux');
  return {
    login: (user, token) => dispatch(actions.login(user, token)),
    logout: () => dispatch(actions.logout()),
    setTheme: (theme) => dispatch(actions.setTheme(theme)),
    setUnReadMessages: (messages) => dispatch(actions.setUnReadMessages(messages)),
    setUnReadRequests: (requests) => dispatch(actions.setUnReadRequests(requests)),
    updateRequests: (request) => dispatch(actions.updateRequests(request)),
    setRequest: (request) => dispatch(actions.setRequest(request)),
    setNotifications: (unread, notifications) => dispatch(actions.setNotifications(unread, notifications)),
    updateNotifications: (unread, notification) => dispatch(actions.updateNotifications(unread, notification)),
    updateMessagesOnGroup: (message) => dispatch(actions.updateMessagesOnGroup(message)),
    setMessenger: (unread, messages) => dispatch(actions.setMessenger(unread, messages)),
    updateMessengerGroup: (messengerGroup) => dispatch(actions.updateMessengerGroup(messengerGroup)),
    setMessengerGroup: (messengerGroup) => dispatch(actions.setMessengerGroup(messengerGroup)),
    setMessagesOnGroup: (messagesOnGroup) => dispatch(actions.setMessagesOnGroup(messagesOnGroup)),
    updateMessagesOnGroupByPayload: (messages) => dispatch(actions.updateMessagesOnGroupByPayload(messages)),
    setSearchParameter: (searchParameter) => dispatch(actions.setSearchParameter(searchParameter)),
    setSystemNotification: (systemNotification) => dispatch(actions.setSystemNotification(systemNotification)),
    setDeepLinkRoute: (deepLinkRoute) => dispatch(actions.setDeepLinkRoute(deepLinkRoute)),
    viewChangePass: (changePassword) => dispatch(actions.viewChangePass(changePassword)),
    setAcceptPayment: (acceptPayment) => dispatch(actions.setAcceptPayment(acceptPayment)),
    setComments: (comments) => dispatch(actions.setComments(comments)),
    setPaymentConfirmation: (flag) => dispatch(actions.setPaymentConfirmation(flag)),
    setEnableFingerPrint(isEnable){
      dispatch(actions.setEnableFingerPrint(isEnable));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);