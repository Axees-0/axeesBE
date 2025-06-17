import * as React from "react";
import { Text, StyleSheet, View } from "react-native";
import { Image } from "expo-image";

import Arrowleft021 from "../../assets/arrowleft021.svg";
import Helpcircle from "../../assets/helpcircle.svg";
import Calendar03 from "../../assets/calendar03.svg";
import Cloudupload from "../../assets/cloudupload.svg";
import Checkmarksquare011 from "../../assets/checkmarksquare011.svg";
import {
  Color,
  FontFamily,
  FontSize,
  Padding,
  Border,
  Gap,
} from "@/GlobalStyles";

const UOM06MarketerOfferCounterEdit = () => {
  return (
    <View style={styles.uom06marketeroffercounteredit}>
      <Text style={styles.editCounterOffer}>Edit Counter Offer</Text>
      <Arrowleft021
        style={[styles.arrowLeft02Icon, styles.iconLayout]}
        width={24}
        height={24}
      />
      <View style={[styles.fieldParent, styles.batteryPosition]}>
        <View style={styles.fieldFlexBox}>
          <Text style={[styles.offerName, styles.offerNameTypo]}>
            Offer Name
          </Text>
          <Text style={[styles.pepsiPromoJanuary, styles.offerDetailsTypo]}>
            Pepsi Promo January
          </Text>
        </View>
        <View style={styles.frameParent}>
          <View style={styles.frameGroup}>
            <View style={[styles.offerDetailsParent, styles.parentFlexBox1]}>
              <Text style={[styles.offerDetails, styles.offerDetailsTypo]}>
                Offer Details
              </Text>
              <Helpcircle style={styles.iconLayout} width={24} height={24} />
            </View>
            <View style={styles.frameContainer}>
              <View style={styles.frameWrapper}>
                <View style={styles.frameView}>
                  <View style={styles.fieldFlexBox}>
                    <Text style={[styles.offerName, styles.offerNameTypo]}>
                      Platforms
                    </Text>
                    <View style={[styles.frameParent1, styles.parentFlexBox1]}>
                      <View style={styles.pngClipartYoutubePlayButtoWrapper}>
                        <Image
                          style={styles.pngClipartYoutubePlayButtoIcon}
                          contentFit="cover"
                          source={require("../../assets/pngclipartyoutubeplaybuttoncomputericonsyoutubeyoutubelogoanglerectanglethumbnail-1.png")}
                        />
                      </View>
                      <View
                        style={[
                          styles.pngClipartInstagramLogoIcoWrapper,
                          styles.wrapperBorder,
                        ]}
                      >
                        <Image
                          style={styles.pngClipartInstagramLogoIcoIcon}
                          contentFit="cover"
                          source={require("../../assets/pngclipartinstagramlogoiconotherstextphotographythumbnail-1.png")}
                        />
                      </View>
                      <View
                        style={[
                          styles.pngClipartInstagramLogoIcoWrapper,
                          styles.wrapperBorder,
                        ]}
                      >
                        <Image
                          style={styles.pngClipartInstagramLogoIcoIcon}
                          contentFit="cover"
                          source={require("../../assets/1707226109newtwitterlogopng-1.png")}
                        />
                      </View>
                      <View style={styles.pngClipartYoutubePlayButtoWrapper}>
                        <Image
                          style={styles.pngClipartInstagramLogoIcoIcon}
                          contentFit="cover"
                          source={require("../../assets/660bcb3e9408cfa1747d2d6e4c8c4526-11.png")}
                        />
                      </View>
                      <View
                        style={[
                          styles.pngClipartInstagramLogoIcoWrapper,
                          styles.wrapperBorder,
                        ]}
                      >
                        <Image
                          style={styles.transparentTiktokLogoBlackIcon}
                          contentFit="cover"
                          source={require("../../assets/transparenttiktoklogoblackandwhitelogotiktokappminimaminimalistblackandwhitetiktokapp1711004158896-1.png")}
                        />
                      </View>
                      <View
                        style={[
                          styles.pngClipartInstagramLogoIcoWrapper,
                          styles.wrapperBorder,
                        ]}
                      >
                        <Image
                          contentFit="cover"
                          source={require("../../assets/twitchlogotwitchlogotransparenttwitchicontransparentfreefreepng-1.png")}
                        />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.fieldFlexBox}>
                <Text style={[styles.offerName, styles.offerNameTypo]}>
                  Descriptions/Instructions
                </Text>
                <View
                  style={[
                    styles.loremIpsumDolorSitAmetConWrapper,
                    styles.wrapperBorder,
                  ]}
                >
                  <Text
                    style={[styles.loremIpsumDolor, styles.browseFilesTypo]}
                  >
                    Lorem ipsum dolor sit amet consectetur. Molestie fermentum
                    hac nisi volutpat mattis odio diam est ut. Quis integer
                    dictum imperdiet dictum. Feugiat diam morbi ullamcorper
                    ullamcorper sagittis etiam sed. Libero commodo sit purus
                    pellentesque id turpis.
                  </Text>
                </View>
              </View>
              <View style={styles.fieldFlexBox}>
                <Text style={[styles.offerName, styles.offerNameTypo]}>
                  Desired Content Review Date
                </Text>
                <View
                  style={[styles.january122025Parent, styles.wrapperLayout]}
                >
                  <Text style={[styles.january122025, styles.browseFilesTypo]}>
                    January 12, 2025
                  </Text>
                  <Calendar03 width={24} height={24} />
                </View>
              </View>
              <View style={styles.fieldFlexBox}>
                <Text style={[styles.offerName, styles.offerNameTypo]}>
                  Desired Post Date
                </Text>
                <View
                  style={[styles.january122025Parent, styles.wrapperLayout]}
                >
                  <Text style={[styles.january122025, styles.browseFilesTypo]}>
                    January 11, 2025
                  </Text>
                  <Calendar03 width={24} height={24} />
                </View>
              </View>
              <View style={styles.fieldFlexBox}>
                <Text style={[styles.offerName, styles.offerNameTypo]}>
                  Your Offer
                </Text>
                <View style={styles.wrapperLayout}>
                  <Text style={[styles.january122025, styles.browseFilesTypo]}>
                    $1,300.00
                  </Text>
                </View>
              </View>
              <View style={styles.fieldFlexBox}>
                <Text style={[styles.offerName, styles.offerNameTypo]}>
                  Notes
                </Text>
                <View
                  style={[styles.anyNotesHereWrapper, styles.wrapperBorder]}
                >
                  <Text style={[styles.january122025, styles.browseFilesTypo]}>
                    Any notes here
                  </Text>
                </View>
              </View>
              <View style={styles.fieldFlexBox}>
                <Text style={[styles.offerName, styles.offerNameTypo]}>
                  Upload Files
                </Text>
                <View style={[styles.cloudUploadParent, styles.parentFlexBox]}>
                  <Cloudupload width={24} height={24} />
                  <View style={styles.parentFlexBox}>
                    <Text
                      style={[styles.attachContent, styles.browseFilesTypo]}
                    >
                      Attach Content
                    </Text>
                    <Text style={[styles.pdfGifJpeg, styles.offerNameTypo]}>
                      pdf, gif, jpeg, sng, png, photoshop, adobe
                    </Text>
                  </View>
                  <View style={styles.browseFilesWrapper}>
                    <Text style={[styles.browseFiles, styles.browseFilesTypo]}>
                      Browse Files
                    </Text>
                  </View>
                </View>
              </View>
            </View>
            <View
              style={[styles.checkmarkSquare01Parent, styles.parentFlexBox1]}
            >
              <Checkmarksquare011
                style={styles.checkmarkSquare01Icon}
                width={32}
                height={32}
              />
              <Text style={styles.byAgreeingWeContainer}>
                <Text
                  style={styles.byAgreeingWe}
                >{`By agreeing, we assume you have read the `}</Text>
                <Text style={styles.transactionTerms}>Transaction Terms</Text>
              </Text>
            </View>
          </View>
          <View style={styles.frameParent2}>
            <View style={[styles.sendWrapper, styles.wrapperFlexBox]}>
              <Text style={[styles.send, styles.sendTypo]}>{`Send  `}</Text>
            </View>
            <View style={[styles.saveDraftWrapper, styles.wrapperFlexBox]}>
              <Text style={[styles.saveDraft, styles.sendTypo]}>
                Save Draft
              </Text>
            </View>
            <View style={[styles.deleteWrapper, styles.wrapperFlexBox]}>
              <Text style={[styles.delete, styles.sendTypo]}>Delete</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  timePosition: {
    top: "50%",
    width: "35.75%",
    marginTop: -25.8,
    height: 52,
    position: "absolute",
  },
  batteryPosition: {
    left: "50%",
    position: "absolute",
  },
  iconPosition: {
    maxHeight: "100%",
    left: "50%",
    position: "absolute",
  },
  capacityPosition: {
    backgroundColor: Color.cSK430B92950,
    left: "50%",
    position: "absolute",
  },
  iconLayout: {},
  offerNameTypo: {
    opacity: 0.5,
    textAlign: "left",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
  },
  offerDetailsTypo: {
    fontFamily: FontFamily.degular,
    textAlign: "left",
    fontSize: FontSize.size_5xl,
    color: Color.cSK430B92950,
  },
  parentFlexBox1: {
    alignItems: "center",
    flexDirection: "row",
  },
  wrapperBorder: {
    borderColor: Color.cSK430B9250,
    paddingHorizontal: Padding.p_base,
    borderRadius: Border.br_7xs,
    flexDirection: "row",
    borderWidth: 1,
    borderStyle: "solid",
  },
  browseFilesTypo: {
    fontSize: FontSize.size_sm,
    fontFamily: FontFamily.inter,
  },
  wrapperLayout: {
    height: 58,
    borderColor: Color.cSK430B9250,
    paddingVertical: Padding.p_5xs,
    paddingHorizontal: Padding.p_base,
    borderRadius: Border.br_7xs,
    alignItems: "center",
    flexDirection: "row",
    width: 400,
    borderWidth: 1,
    borderStyle: "solid",
  },
  parentFlexBox: {
    gap: Gap.gap_xs,
    alignItems: "center",
  },
  wrapperFlexBox: {
    borderRadius: Border.br_xs,
    paddingHorizontal: Padding.p_5xl,
    height: 58,
    paddingVertical: Padding.p_5xs,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    alignSelf: "stretch",
  },
  sendTypo: {
    fontWeight: "500",
    fontSize: FontSize.size_lg,
    textAlign: "center",
    fontFamily: FontFamily.inter,
  },
  time1: {
    top: "33.98%",
    left: "38.84%",
    fontSize: FontSize.size_base_2,
    lineHeight: 21,
    textAlign: "center",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
    fontWeight: "600",
    position: "absolute",
  },
  time: {
    right: "64.25%",
    left: "0%",
  },
  border: {
    height: "100%",
    top: "0%",
    bottom: "0%",
    borderRadius: Border.br_8xs_1,
    borderColor: Color.cSK430B92950,
    opacity: 0.35,
    width: 24,
    borderWidth: 1,
    borderStyle: "solid",
    marginLeft: -13.05,
    left: "50%",
    position: "absolute",
  },
  capIcon: {
    marginLeft: 11.75,
    top: "37.1%",
    bottom: "31.45%",
  },
  capacity: {
    height: "69.35%",
    marginLeft: -11.15,
    top: "15.32%",
    bottom: "15.32%",
    borderRadius: Border.br_10xs_4,
    width: 20,
  },
  battery: {
    height: "24.08%",
    marginLeft: 10.05,
    top: "42.52%",
    bottom: "33.4%",
    width: 26,
  },
  wifiIcon: {
    top: "43.88%",
    bottom: "33.2%",
    marginLeft: -13.05,
    maxHeight: "100%",
  },
  cellularConnectionIcon: {
    marginLeft: -38.55,
    top: "43.69%",
    bottom: "33.59%",
  },
  levels: {
    right: "0%",
    left: "64.25%",
  },
  statusBarIphone: {
    top: 0,
    left: 0,
    height: 52,
    width: 440,
    position: "absolute",
    backgroundColor: Color.white,
  },
  homeIndicator1: {
    marginLeft: 72,
    bottom: 8,
    borderRadius: Border.br_81xl,
    width: 144,
    height: 5,
    transform: [
      {
        rotate: "180deg",
      },
    ],
  },
  homeIndicator: {
    marginLeft: -220,
    bottom: 0,
    height: 34,
    width: 440,
    left: "50%",
    backgroundColor: Color.white,
  },
  editCounterOffer: {
    marginLeft: -106,
    top: 79,
    fontSize: FontSize.size_5xl,
    left: "50%",
    textAlign: "center",
    color: Color.cSK430B92950,
    fontFamily: FontFamily.inter,
    fontWeight: "600",
    position: "absolute",
  },
  arrowLeft02Icon: {
    top: 82,
    left: 20,
    position: "absolute",
  },
  offerName: {
    fontSize: FontSize.size_xl,
    alignSelf: "stretch",
  },
  pepsiPromoJanuary: {
    alignSelf: "stretch",
  },
  fieldFlexBox: {
    gap: Gap.gap_sm,
    alignSelf: "stretch",
  },
  offerDetails: {
    fontWeight: "600",
  },
  offerDetailsParent: {
    justifyContent: "space-between",
    alignSelf: "stretch",
  },
  pngClipartYoutubePlayButtoIcon: {
    height: 14,
    width: 18,
  },
  pngClipartYoutubePlayButtoWrapper: {
    backgroundColor: Color.cSK430B9250,
    paddingVertical: Padding.p_5xs,
    paddingHorizontal: Padding.p_base,
    borderRadius: Border.br_7xs,
    height: 35,
    alignItems: "center",
    flexDirection: "row",
  },
  pngClipartInstagramLogoIcoIcon: {
    height: 18,
    width: 18,
  },
  pngClipartInstagramLogoIcoWrapper: {
    paddingVertical: Padding.p_5xs,
    height: 35,
    borderColor: Color.cSK430B9250,
    alignItems: "center",
  },
  transparentTiktokLogoBlackIcon: {
    height: 19,
    width: 18,
  },
  frameParent1: {
    flexWrap: "wrap",
    alignContent: "center",
    gap: Gap.gap_sm,
    alignSelf: "stretch",
  },
  frameView: {
    justifyContent: "center",
    alignSelf: "stretch",
  },
  frameWrapper: {
    alignSelf: "stretch",
  },
  loremIpsumDolor: {
    textAlign: "left",
    color: Color.cSK430B92950,
    flex: 1,
  },
  loremIpsumDolorSitAmetConWrapper: {
    paddingTop: Padding.p_xs,
    paddingBottom: 42,
    width: 400,
  },
  january122025: {
    textAlign: "center",
    color: Color.cSK430B92950,
  },
  january122025Parent: {
    justifyContent: "space-between",
  },
  anyNotesHereWrapper: {
    height: 127,
    paddingVertical: Padding.p_5xs,
    width: 400,
  },
  attachContent: {
    textAlign: "left",
    color: Color.cSK430B92950,
  },
  pdfGifJpeg: {
    fontSize: FontSize.size_xs,
  },
  browseFiles: {
    color: Color.cSK430B92500,
    textAlign: "center",
  },
  browseFilesWrapper: {
    borderRadius: 8,
    paddingHorizontal: Padding.p_5xl,
    borderColor: Color.cSK430B92500,
    paddingVertical: Padding.p_xs,
    flexDirection: "row",
    borderWidth: 1,
    borderStyle: "solid",
  },
  cloudUploadParent: {
    paddingVertical: Padding.p_xs,
    gap: Gap.gap_xs,
    borderColor: Color.cSK430B9250,
    paddingHorizontal: Padding.p_base,
    borderRadius: Border.br_7xs,
    justifyContent: "center",
    width: 400,
    borderWidth: 1,
    borderStyle: "solid",
  },
  frameContainer: {
    gap: 20,
    alignSelf: "stretch",
  },
  checkmarkSquare01Icon: {},
  byAgreeingWe: {
    color: Color.cSK430B92950,
  },
  transactionTerms: {
    color: Color.cSK430B92500,
  },
  byAgreeingWeContainer: {
    fontSize: FontSize.size_base,
    width: 335,
    textAlign: "left",
    fontFamily: FontFamily.inter,
  },
  checkmarkSquare01Parent: {
    gap: Gap.gap_md,
  },
  frameGroup: {
    gap: Gap.gap_md,
    alignSelf: "stretch",
  },
  send: {
    color: Color.white,
  },
  sendWrapper: {
    backgroundColor: Color.cSK430B92500,
  },
  saveDraft: {
    color: Color.cSK430B92500,
  },
  saveDraftWrapper: {
    borderColor: Color.cSK430B92500,
    borderRadius: Border.br_xs,
    borderWidth: 1,
    borderStyle: "solid",
  },
  delete: {
    color: Color.grey,
  },
  deleteWrapper: {
    borderColor: Color.grey,
    borderWidth: 1,
    borderStyle: "solid",
    borderRadius: Border.br_xs,
  },
  frameParent2: {
    gap: Gap.gap_md,
    width: 400,
  },
  frameParent: {
    gap: Gap.gap_xl,
    alignSelf: "stretch",
  },
  fieldParent: {
    marginLeft: -200,
    top: 155,
    gap: Gap.gap_lg,
    width: 400,
  },
  uom06marketeroffercounteredit: {
    width: "100%",
    height: 1723,
    overflow: "hidden",
    flex: 1,
    backgroundColor: Color.white,
  },
});

export default UOM06MarketerOfferCounterEdit;
