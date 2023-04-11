pragma solidity ^0.8.0;
import "forge-std/console.sol";

library MailServer {
  uint16 constant rsa_modulus_chunks_len = 17;
  struct Server {
    mapping(string => uint256[rsa_modulus_chunks_len]) verifiedMailserverKeys;
  }

  function initMailserverKeys(Server storage self) internal {
    // TODO: Create a type that takes in a raw RSA key, the bit count,
    // and whether or not its base64 encoded, and converts it to either 8 or 16 signals
    self.verifiedMailserverKeys["gmail.com"][0] = 2645260732387577900369388087711111123;
    self.verifiedMailserverKeys["gmail.com"][1] = 2332356685544126002119529566553287568;
    self.verifiedMailserverKeys["gmail.com"][2] = 587306946802222480578301599869128605;
    self.verifiedMailserverKeys["gmail.com"][3] = 1506808391343308562602228807782956759;
    self.verifiedMailserverKeys["gmail.com"][4] = 346696857027646434280628892032962406;
    self.verifiedMailserverKeys["gmail.com"][5] = 1655371642328152796841392591809876356;
    self.verifiedMailserverKeys["gmail.com"][6] = 773654757689631205903545947464515700;
    self.verifiedMailserverKeys["gmail.com"][7] = 137546842031326636154929265514533208;
    self.verifiedMailserverKeys["gmail.com"][8] = 979104436480501594376401576155183314;
    self.verifiedMailserverKeys["gmail.com"][9] = 1231402749194646866996172591430155068;
    self.verifiedMailserverKeys["gmail.com"][10] = 1573385231473380013164181608611759098;
    self.verifiedMailserverKeys["gmail.com"][11] = 1199794061179553911325952711127005960;
    self.verifiedMailserverKeys["gmail.com"][12] = 1393369642957971131987926230229916984;
    self.verifiedMailserverKeys["gmail.com"][13] = 2610100650498432208787557818514105421;
    self.verifiedMailserverKeys["gmail.com"][14] = 1405475120223887084339881602469286332;
    self.verifiedMailserverKeys["gmail.com"][15] = 2000538708964654339221687925776343058;
    self.verifiedMailserverKeys["gmail.com"][16] = 3483697379198011592407370076533025;

    self.verifiedMailserverKeys["hotmail.com"][0] = 128339925410438117770406273090474249;
    self.verifiedMailserverKeys["hotmail.com"][1] = 2158906895782814996316644028571725310;
    self.verifiedMailserverKeys["hotmail.com"][2] = 2278019331164769360372919938620729773;
    self.verifiedMailserverKeys["hotmail.com"][3] = 1305319804455735154587383372570664109;
    self.verifiedMailserverKeys["hotmail.com"][4] = 2358345194772578919713586294428642696;
    self.verifiedMailserverKeys["hotmail.com"][5] = 1333692900109074470874155333266985021;
    self.verifiedMailserverKeys["hotmail.com"][6] = 2252956899717870524129098594286063236;
    self.verifiedMailserverKeys["hotmail.com"][7] = 1963190090223950324858653797870319519;
    self.verifiedMailserverKeys["hotmail.com"][8] = 2099240641399560863760865662500577339;
    self.verifiedMailserverKeys["hotmail.com"][9] = 1591320380606901546957315803395187883;
    self.verifiedMailserverKeys["hotmail.com"][10] = 1943831890994545117064894677442719428;
    self.verifiedMailserverKeys["hotmail.com"][11] = 2243327453964709681573059557263184139;
    self.verifiedMailserverKeys["hotmail.com"][12] = 1078181067739519006314708889181549671;
    self.verifiedMailserverKeys["hotmail.com"][13] = 2209638307239559037039565345615684964;
    self.verifiedMailserverKeys["hotmail.com"][14] = 1936371786309180968911326337008120155;
    self.verifiedMailserverKeys["hotmail.com"][15] = 2611115500285740051274748743252547506;
    self.verifiedMailserverKeys["hotmail.com"][16] = 3841983033048617585564391738126779;

    self.verifiedMailserverKeys["ethereum.org"][0] = 119886678941863893035426121053426453;
    self.verifiedMailserverKeys["ethereum.org"][1] = 1819786846289142128062035525540154587;
    self.verifiedMailserverKeys["ethereum.org"][2] = 18664768675154515296388092785538021;
    self.verifiedMailserverKeys["ethereum.org"][3] = 2452916380017370778812419704280324749;
    self.verifiedMailserverKeys["ethereum.org"][4] = 147541693845229442834461965414634823;
    self.verifiedMailserverKeys["ethereum.org"][5] = 714676313158744653841521918164405002;
    self.verifiedMailserverKeys["ethereum.org"][6] = 1495951612535183023869749054624579068;
    self.verifiedMailserverKeys["ethereum.org"][7] = 974892773071523448175479681445882254;
    self.verifiedMailserverKeys["ethereum.org"][8] = 53117264910028079;
    self.verifiedMailserverKeys["ethereum.org"][9] = 0;
    self.verifiedMailserverKeys["ethereum.org"][10] = 0;
    self.verifiedMailserverKeys["ethereum.org"][11] = 0;
    self.verifiedMailserverKeys["ethereum.org"][12] = 0;
    self.verifiedMailserverKeys["ethereum.org"][13] = 0;
    self.verifiedMailserverKeys["ethereum.org"][14] = 0;
    self.verifiedMailserverKeys["ethereum.org"][15] = 0;
    self.verifiedMailserverKeys["ethereum.org"][16] = 0;

    self.verifiedMailserverKeys["skiff.com"][0] = 2637270478154147701703365710201556843;
    self.verifiedMailserverKeys["skiff.com"][1] = 2082690054369201099288110516791254232;
    self.verifiedMailserverKeys["skiff.com"][2] = 1108253255381437937379143813840625818;
    self.verifiedMailserverKeys["skiff.com"][3] = 1535554154331979875086566323552212673;
    self.verifiedMailserverKeys["skiff.com"][4] = 273019276149049264013012583938735085;
    self.verifiedMailserverKeys["skiff.com"][5] = 741436192387359949728618527229215889;
    self.verifiedMailserverKeys["skiff.com"][6] = 1851608307869135205473270393049341043;
    self.verifiedMailserverKeys["skiff.com"][7] = 1428718881138594152975742734455140338;
    self.verifiedMailserverKeys["skiff.com"][8] = 778850382237088374273157869416671135;
    self.verifiedMailserverKeys["skiff.com"][9] = 549599381370898291203601849666570597;
    self.verifiedMailserverKeys["skiff.com"][10] = 221161044322752364431317167498442512;
    self.verifiedMailserverKeys["skiff.com"][11] = 2041801755941244198449288035460748224;
    self.verifiedMailserverKeys["skiff.com"][12] = 1083114189020989870026920716001138899;
    self.verifiedMailserverKeys["skiff.com"][13] = 1380362773644527202561949550864154963;
    self.verifiedMailserverKeys["skiff.com"][14] = 1366599807917971505788646146248798329;
    self.verifiedMailserverKeys["skiff.com"][15] = 391565989352979266796804441125988853;
    self.verifiedMailserverKeys["skiff.com"][16] = 3704766395208948862861103932863036;
  }

  function _stringEq(string memory a, string memory b) public pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
  }

  function isVerified(Server storage self, string memory domain, uint256 index, uint256 val) public view returns (bool) {
    // allow external queries on mapping
    uint256 val1 = self.verifiedMailserverKeys[domain][index];
    uint256 val2 = val;
    console.log(val1, val2);

    return self.verifiedMailserverKeys[domain][index] == val;
  }
}
