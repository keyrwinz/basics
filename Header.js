import React, { Component } from 'react';
import { View , Image, Text} from 'react-native';
import Style from './Style';
import {Helper} from 'common';
export default  class Header extends Component{
  render(){
    return (
      <View>
        <View style={Style.LogoContainer}>
          <Image source={require('assets/logo.png')} style={Style.LogoSize}/>
        </View>
        <View style={{
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <Text style={{
            paddingTop: 20,
            paddingBottom: 20
          }}>{this.props.params} to {Helper.APP_NAME_BASIC}</Text>
        </View>
      </View>
    );
  }
}