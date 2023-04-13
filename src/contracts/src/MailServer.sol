pragma solidity ^0.8.0;

import "forge-std/console.sol";

contract MailServer {
  uint16 constant rsa_modulus_chunks_len = 17;
  //   struct Server {
  mapping(string => uint256[rsa_modulus_chunks_len]) verifiedMailserverKeys;

  //   }

  constructor() {
    initMailserverKeys();
  }

  function initMailserverKeys() internal {
    // TODO: Create a type that takes in a raw RSA key, the bit count,
    // and whether or not its base64 encoded, and converts it to either 8 or 16 signals
    verifiedMailserverKeys["gmail.com"][0] = 2645260732387577900369388087711111123;
    verifiedMailserverKeys["gmail.com"][1] = 2332356685544126002119529566553287568;
    verifiedMailserverKeys["gmail.com"][2] = 587306946802222480578301599869128605;
    verifiedMailserverKeys["gmail.com"][3] = 1506808391343308562602228807782956759;
    verifiedMailserverKeys["gmail.com"][4] = 346696857027646434280628892032962406;
    verifiedMailserverKeys["gmail.com"][5] = 1655371642328152796841392591809876356;
    verifiedMailserverKeys["gmail.com"][6] = 773654757689631205903545947464515700;
    verifiedMailserverKeys["gmail.com"][7] = 137546842031326636154929265514533208;
    verifiedMailserverKeys["gmail.com"][8] = 979104436480501594376401576155183314;
    verifiedMailserverKeys["gmail.com"][9] = 1231402749194646866996172591430155068;
    verifiedMailserverKeys["gmail.com"][10] = 1573385231473380013164181608611759098;
    verifiedMailserverKeys["gmail.com"][11] = 1199794061179553911325952711127005960;
    verifiedMailserverKeys["gmail.com"][12] = 1393369642957971131987926230229916984;
    verifiedMailserverKeys["gmail.com"][13] = 2610100650498432208787557818514105421;
    verifiedMailserverKeys["gmail.com"][14] = 1405475120223887084339881602469286332;
    verifiedMailserverKeys["gmail.com"][15] = 2000538708964654339221687925776343058;
    verifiedMailserverKeys["gmail.com"][16] = 3483697379198011592407370076533025;

    verifiedMailserverKeys["hotmail.com"][0] = 128339925410438117770406273090474249;
    verifiedMailserverKeys["hotmail.com"][1] = 2158906895782814996316644028571725310;
    verifiedMailserverKeys["hotmail.com"][2] = 2278019331164769360372919938620729773;
    verifiedMailserverKeys["hotmail.com"][3] = 1305319804455735154587383372570664109;
    verifiedMailserverKeys["hotmail.com"][4] = 2358345194772578919713586294428642696;
    verifiedMailserverKeys["hotmail.com"][5] = 1333692900109074470874155333266985021;
    verifiedMailserverKeys["hotmail.com"][6] = 2252956899717870524129098594286063236;
    verifiedMailserverKeys["hotmail.com"][7] = 1963190090223950324858653797870319519;
    verifiedMailserverKeys["hotmail.com"][8] = 2099240641399560863760865662500577339;
    verifiedMailserverKeys["hotmail.com"][9] = 1591320380606901546957315803395187883;
    verifiedMailserverKeys["hotmail.com"][10] = 1943831890994545117064894677442719428;
    verifiedMailserverKeys["hotmail.com"][11] = 2243327453964709681573059557263184139;
    verifiedMailserverKeys["hotmail.com"][12] = 1078181067739519006314708889181549671;
    verifiedMailserverKeys["hotmail.com"][13] = 2209638307239559037039565345615684964;
    verifiedMailserverKeys["hotmail.com"][14] = 1936371786309180968911326337008120155;
    verifiedMailserverKeys["hotmail.com"][15] = 2611115500285740051274748743252547506;
    verifiedMailserverKeys["hotmail.com"][16] = 3841983033048617585564391738126779;

    verifiedMailserverKeys["ethereum.org"][0] = 119886678941863893035426121053426453;
    verifiedMailserverKeys["ethereum.org"][1] = 1819786846289142128062035525540154587;
    verifiedMailserverKeys["ethereum.org"][2] = 18664768675154515296388092785538021;
    verifiedMailserverKeys["ethereum.org"][3] = 2452916380017370778812419704280324749;
    verifiedMailserverKeys["ethereum.org"][4] = 147541693845229442834461965414634823;
    verifiedMailserverKeys["ethereum.org"][5] = 714676313158744653841521918164405002;
    verifiedMailserverKeys["ethereum.org"][6] = 1495951612535183023869749054624579068;
    verifiedMailserverKeys["ethereum.org"][7] = 974892773071523448175479681445882254;
    verifiedMailserverKeys["ethereum.org"][8] = 53117264910028079;
    verifiedMailserverKeys["ethereum.org"][9] = 0;
    verifiedMailserverKeys["ethereum.org"][10] = 0;
    verifiedMailserverKeys["ethereum.org"][11] = 0;
    verifiedMailserverKeys["ethereum.org"][12] = 0;
    verifiedMailserverKeys["ethereum.org"][13] = 0;
    verifiedMailserverKeys["ethereum.org"][14] = 0;
    verifiedMailserverKeys["ethereum.org"][15] = 0;
    verifiedMailserverKeys["ethereum.org"][16] = 0;

    verifiedMailserverKeys["ethereum.org"][0] = 119886678941863893035426121053426453;
    verifiedMailserverKeys["ethereum.org"][1] = 1819786846289142128062035525540154587;
    verifiedMailserverKeys["ethereum.org"][2] = 18664768675154515296388092785538021;
    verifiedMailserverKeys["ethereum.org"][3] = 2452916380017370778812419704280324749;
    verifiedMailserverKeys["ethereum.org"][4] = 147541693845229442834461965414634823;
    verifiedMailserverKeys["ethereum.org"][5] = 714676313158744653841521918164405002;
    verifiedMailserverKeys["ethereum.org"][6] = 1495951612535183023869749054624579068;
    verifiedMailserverKeys["ethereum.org"][7] = 974892773071523448175479681445882254;
    verifiedMailserverKeys["ethereum.org"][8] = 53117264910028079;
    verifiedMailserverKeys["ethereum.org"][9] = 0;
    verifiedMailserverKeys["ethereum.org"][10] = 0;
    verifiedMailserverKeys["ethereum.org"][11] = 0;
    verifiedMailserverKeys["ethereum.org"][12] = 0;
    verifiedMailserverKeys["ethereum.org"][13] = 0;
    verifiedMailserverKeys["ethereum.org"][14] = 0;
    verifiedMailserverKeys["ethereum.org"][15] = 0;
    verifiedMailserverKeys["ethereum.org"][16] = 0;

    verifiedMailserverKeys["twitter.com"][0] = 1634582323953821262989958727173988295;
    verifiedMailserverKeys["twitter.com"][1] = 1938094444722442142315201757874145583;
    verifiedMailserverKeys["twitter.com"][2] = 375300260153333632727697921604599470;
    verifiedMailserverKeys["twitter.com"][3] = 1369658125109277828425429339149824874;
    verifiedMailserverKeys["twitter.com"][4] = 1589384595547333389911397650751436647;
    verifiedMailserverKeys["twitter.com"][5] = 1428144289938431173655248321840778928;
    verifiedMailserverKeys["twitter.com"][6] = 1919508490085653366961918211405731923;
    verifiedMailserverKeys["twitter.com"][7] = 2358009612379481320362782200045159837;
    verifiedMailserverKeys["twitter.com"][8] = 518833500408858308962881361452944175;
    verifiedMailserverKeys["twitter.com"][9] = 1163210548821508924802510293967109414;
    verifiedMailserverKeys["twitter.com"][10] = 1361351910698751746280135795885107181;
    verifiedMailserverKeys["twitter.com"][11] = 1445969488612593115566934629427756345;
    verifiedMailserverKeys["twitter.com"][12] = 2457340995040159831545380614838948388;
    verifiedMailserverKeys["twitter.com"][13] = 2612807374136932899648418365680887439;
    verifiedMailserverKeys["twitter.com"][14] = 16021263889082005631675788949457422;
    verifiedMailserverKeys["twitter.com"][15] = 299744519975649772895460843780023483;
    verifiedMailserverKeys["twitter.com"][16] = 3933359104846508935112096715593287;
    verifiedMailserverKeys["twitter.com"][17] = 556307310756571904145052207427031380052712977221;

    verifiedMailserverKeys["skiff.com"][0] = 2637270478154147701703365710201556843;
    verifiedMailserverKeys["skiff.com"][1] = 2082690054369201099288110516791254232;
    verifiedMailserverKeys["skiff.com"][2] = 1108253255381437937379143813840625818;
    verifiedMailserverKeys["skiff.com"][3] = 1535554154331979875086566323552212673;
    verifiedMailserverKeys["skiff.com"][4] = 273019276149049264013012583938735085;
    verifiedMailserverKeys["skiff.com"][5] = 741436192387359949728618527229215889;
    verifiedMailserverKeys["skiff.com"][6] = 1851608307869135205473270393049341043;
    verifiedMailserverKeys["skiff.com"][7] = 1428718881138594152975742734455140338;
    verifiedMailserverKeys["skiff.com"][8] = 778850382237088374273157869416671135;
    verifiedMailserverKeys["skiff.com"][9] = 549599381370898291203601849666570597;
    verifiedMailserverKeys["skiff.com"][10] = 221161044322752364431317167498442512;
    verifiedMailserverKeys["skiff.com"][11] = 2041801755941244198449288035460748224;
    verifiedMailserverKeys["skiff.com"][12] = 1083114189020989870026920716001138899;
    verifiedMailserverKeys["skiff.com"][13] = 1380362773644527202561949550864154963;
    verifiedMailserverKeys["skiff.com"][14] = 1366599807917971505788646146248798329;
    verifiedMailserverKeys["skiff.com"][15] = 391565989352979266796804441125988853;
    verifiedMailserverKeys["skiff.com"][16] = 3704766395208948862861103932863036;
  }

  function _stringEq(string memory a, string memory b) internal pure returns (bool) {
    return keccak256(abi.encodePacked(a)) == keccak256(abi.encodePacked(b));
  }

  function isVerified(string memory domain, uint256 index, uint256 val) public view returns (bool) {
    // allow external queries on mapping
    uint256 val1 = verifiedMailserverKeys[domain][index];
    uint256 val2 = val;
    if (val1 != val2) {
      console.log(val1, val2);
    }

    return verifiedMailserverKeys[domain][index] == val;
  }
}
