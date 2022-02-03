import React, { Component } from 'react';
import { connect } from 'react-redux';
import AsyncStorage from '@react-native-community/async-storage';
import { KeyboardAvoidingView, View , TextInput, Text, ScrollView, TouchableOpacity, Dimensions, SafeAreaView, Linking, Platform} from 'react-native';
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
import LoaderModal from '../../generic/LoaderModal.js';
import DeviceInfo from 'react-native-device-info';
import {NavigationActions, StackActions} from 'react-navigation';
const height = Math.round(Dimensions.get('window').height);
class Login extends Component {
  constructor(props){
    super(props);
    this.notificationHandler = React.createRef();
    // this.BackEnd = new Api();
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
      isConnected: false,
      manufacturers: null,
      deviceCode: null
    };
    this.audio = null;
  }

  navigateToScreen = (route) => {
    this.setState({isLoading: false})
    const navigateAction = NavigationActions.navigate({
      routeName: 'drawerStack',
      action: StackActions.reset({
        index: 0,
        key: null,
        actions: [
            NavigationActions.navigate({routeName: route, params: {
              initialRouteName: route,
              index: 0
            }}),
        ]
      })
    });
    this.props.navigation.dispatch(navigateAction);
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
  
  async componentDidMount(){
    // console.log('[api>>>>>>]', this.BackEnd)
    this.setState({deviceCode: DeviceInfo.getUniqueId()})
    if((await AsyncStorage.getItem('username') != null && await AsyncStorage.getItem('password') != null)){
      await this.setState({showFingerPrint: true})
      await this.setState({notEmpty: true})
      await this.getTheme()
    }

    this.getData();
    this.checkInternetConnection();
  }

  // componentWillUnmount() {
  //   this.focusListener.remove()
  // }
  
  
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
        if(route.split('/')[2] === 'profile') {
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
      const index = await AsyncStorage.getItem(Helper.APP_NAME + 'index');
      if(primary != null && secondary != null && tertiary != null) {
        const { setTheme } = this.props;
        setTheme({
          primary: primary,
          secondary: secondary,
          tertiary: tertiary,
          fourth: fourth,
          index: parseInt(index)
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
      this.navigateToScreen('Dashboard')
      return true;
    }
  }

  redirect = (route) => {
    const {user} = this.props.state;
    setTimeout(() => {
      if(user?.devices?.length > 0 && user?.devices?.includes(this.state.deviceCode)){
        console.log('[asdfasdf]', user);
        this.props.navigation.navigate(route);
        setInterval(() => {
          this.setState({isLoading: false});
        }, 10000)
      }else{
        if(config.TEST_DEVICE_FLAG === true) {
          this.navigateToScreen('Dashboard')
        } else {
          this.props.navigation.navigate('checkDeviceStack');
        }
        this.setState({isLoading: false});
      }
      
    }, 1000)
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
    this.notificationHandler.setTopics()
    this.navigateToScreen('Dashboard')
    return () => {
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
      if(error.message === 'Network request failed'){
        this.setState({isResponseError: true})
      }
    })
  }

  getRemainingBalance = () => {
    const { setRemainingBalancePlan } = this.props;
    const { user } = this.props.state;
    if(user === null){
      return
    }
    let parameter = {
      account_id: user.id
    }
    Api.request(Routes.getRemainingBalancePartner, parameter, response => {
      setRemainingBalancePlan(Number(response.plan_amount) - Number(response.request_amount))
    }, error => {
      if(error.message === 'Network request failed'){
        this.setState({isResponseError: true})
      }
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
          if(response.account_type === 'PARTNER'){
            this.getRemainingBalance()
          }
        }
      }, error => {
        if(error.message === 'Network request failed'){
          this.setState({isResponseError: true})
        }
        this.setState({isLoading: false});
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
    this.navigateToScreen('Dashboard')
  }

  onSuccessOtp = () => {
    this.setState({isOtpModal: false})
    this.navigateToScreen('Dashboard')
  }

  accountRetrieve(parameter){
    
  }

  async confirm(username, password){
      const { setEnableFingerPrint } = this.props;
      const {enable} = this.state
      await this.setState({enable : true})
      await AsyncStorage.setItem('username', username)
      await AsyncStorage.setItem('password', password)
      setEnableFingerPrint(true);
      this.setState({showFingerPrint: true})
  }

  async cancel(){
    const { setEnableFingerPrint } = this.props;  
    const {enable} = this.state
    await this.setState({enable : false})
    await this.setState({showFingerPrint: false})
    setEnableFingerPrint(false);
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
          this.setState({error: 2});
        }
        if(response.token){
          const token = response.token;
          Api.getAuthUser(response.token, async (response) => {
            login(response, token);
            if(response.username){
              await this.firebaseNotification()
              this.setState({ error: 0});
            }
            
          }, error => {
            if(error.message === 'Network request failed'){
              this.setState({isResponseError: true, isLoading: false})
            }else{
              this.setState({isLoading: false})
            }
          })
        }
      }, error => {
        if(error.message === 'Network request failed'){
          this.setState({isResponseError: true, isLoading: false})
        }else{
          this.setState({isLoading: false})
          this.setState({showFingerPrint: false})
        }
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
            if(response !== null){
              if(response.status != 'BLOCKED'){
                this.setState({error: 0});
                if(this.state.notEmpty == true){
                }else{
                  this.openModal(username, password);
                }
                login(response, token);
                this.firebaseNotification()
              }else{
                this.setState({error: 2, isLoading: false});
              }
            }
          }, error => {
            if(error.message === 'Network request failed'){
              this.setState({isResponseError: true, isLoading: false})
            }else{
              this.setState({isLoading: false})
            }
          })
        }
      }, error => {
        if(error.message === 'Network request failed'){
          this.setState({isResponseError: true, isLoading: false})
        }else{
          this.setState({isLoading: false})
          this.setState({showFingerPrint: false})
        }
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
      <KeyboardAvoidingView
        style = {{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : null}>
        <SafeAreaView>
          <ScrollView
            style={{
              backgroundColor: theme ? theme.primary : Color.primary
            }}
            showsVerticalScrollIndicator={false}>
            <View style={{
              flex: 1
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
                height: height * 1.5,
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
                    fontSize: BasicStyles.standardFontSize,
                    marginRight: 30,
                    marginLeft: 50
                  }}>Username and password didn't match or your account is blocked. Please contact payhiramph@gmail.com</Text>
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
                  placeholderTextColor={Color.darkGray}
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
                      <FingerPrintScanner navigate={() => this.navigateToScreen('Dashboard')} login={() => this.onPressFingerPrint(null, null)} onSubmit={(username, password)=>this.handleFingerPrintSubmit(username, password)}/>
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
                      this.props.viewChangePass(0)
                      this.props.navigation.navigate('forgotPasswordStack')
                    }}>
                      <Text style={{
                        width: '100%',
                        textAlign: 'center',
                        paddingBottom: 20,
                        fontSize: BasicStyles.standardFontSize + 1,
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
                    onClick={() => this.props.navigation.navigate('registerStack')}
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

          {isLoading ? <LoaderModal isLoading={isLoading}/> : null }
          {isResponseError ? <CustomError visible={isResponseError} message={this.state.isConnected == true ? 'You have no internet connection' : null}
          onCLose={() => {
            this.setState({isResponseError: false, isLoading: false})
          }}/> : null}
        </SafeAreaView>
      </KeyboardAvoidingView>
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
    setRemainingBalancePlan: (remainingBalancePlan) => dispatch(actions.setRemainingBalancePlan(remainingBalancePlan)),
    setEnableFingerPrint(isEnable){
      dispatch(actions.setEnableFingerPrint(isEnable));
    }
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps
)(Login);
