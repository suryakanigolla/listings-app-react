import React, { FormEvent, useState } from "react";
import { Link, Redirect } from "react-router-dom";
import {
  Button,
  Form,
  Icon,
  Input,
  InputNumber,
  Layout,
  Radio,
  Typography,
  Upload
} from "antd";
import { UploadChangeParam } from "antd/lib/upload";
import { ListingType } from "../../lib/graphql/globalTypes";
import { iconColor, displayErrorMessage, displaySuccessNotification } from "../../lib/utils";
import { Viewer } from "../../lib/types";
import { FormComponentProps } from "antd/lib/form";
import { useMutation } from "@apollo/react-hooks";
import { HOST_LISTING } from "../../lib/graphql/mutations";
import {
  HostListing as HostListingData,
  HostListingVariables
} from "../../lib/graphql/mutations/HostListing/__generated__/HostListing";

interface Props {
  viewer: Viewer;
}

const { Content } = Layout;
const { Text, Title } = Typography;
const { Item } = Form;


export const Host = ({ viewer, form }: Props & FormComponentProps) => { 
  const [hostListing, { loading, data }] = useMutation<
    HostListingData,
    HostListingVariables
  >(HOST_LISTING, {
    onError: () => {
      displayErrorMessage(
        "Sorry! We weren't able to create your listing. Please try again later."
      );
    },
    onCompleted: () => {
      displaySuccessNotification("You've successfully created your listing!");
    }
  });
  const [imageLoading, setImageLoading] = useState(false);
  const [imageBase64Value, setImageBase64Value] = useState<string | null>(null);

  const { getFieldDecorator } = form;


  const handleImageUpload = (info: UploadChangeParam) => {
    const { file } = info; //this file object is not just a file but also status property like loading

    if (file.status === "uploading") {
      setImageLoading(true);
      return;
    }

    if (file.status === "done" && file.originFileObj) { //originFileObj contains the actual file
      getBase64Value(file.originFileObj, imageBase64Value => { //here callback function is used
        setImageBase64Value(imageBase64Value);
        setImageLoading(false);
      });
    }
  };

  if (!viewer.id || !viewer.hasWallet) {
    return (
      <Content className="host-content">
        <div className="host__form-header">
          <Title level={4} className="host__form-title">
            You'll have to be signed in and connected with Stripe to host a listing!
          </Title>
          <Text type="secondary">
            We only allow users who've signed in to our application and have connected
            with Stripe to host new listings. You can sign in at the{" "}
            <Link to="/login">/login</Link> page and connect with Stripe shortly after.
          </Text>
        </div>
      </Content>
    );
  }

  //evt is the event object when submit button is pressed
  const handleHostListing = (evt: FormEvent) => {
    evt.preventDefault();
    form.validateFields((err,values) => {
      if (err) {
        displayErrorMessage("Please complete all the fields to proceed.")
      }

      const fullAddress = `${values.address}, ${values.city}, ${values.state}, ${values.postalCode}`;

      const input = {
        ...values,
        address: fullAddress,
        image: imageBase64Value,
        price: values.price * 100
      };
      delete input.city; //we dont need these fields so we delete before calling mutation query
      delete input.state;
      delete input.postalCode;

      hostListing({
        variables: {
          input
        }
      });
    })
  }

  if (loading) {
    return (
      <Content className="host-content">
        <div className="host__form-header">
          <Title level={3} className="host__form-title">
            Please wait!
          </Title>
          <Text type="secondary">We're creating your listing now.</Text>
        </div>
      </Content>
    );
  }

  if (data && data.hostListing) {
    return <Redirect to={`/listing/${data.hostListing.id}`} />;
  }

  return (
    <Content className="host-content">
      <Form layout="vertical" onSubmit={handleHostListing}>
        <div className="host__form-header">
          <Title level={3} className="host__form-title">
            Hi! Let's get started listing your place.
          </Title>
          <Text type="secondary">
            In this form, we'll collect some basic and additional information about your
            listing.
          </Text>
        </div>

        <Item label="Home Type">
          {getFieldDecorator("type", {
              rules: [
                {
                  required: true,
                  message: "Please select a home type!"
                }
              ]
          })(
              <Radio.Group>
                <Radio.Button value={ListingType.APARTMENT}>
                  <Icon type="bank" style={{ color: iconColor }} /> <span>Apartment</span>
                </Radio.Button>
                <Radio.Button value={ListingType.HOUSE}>
                  <Icon type="home" style={{ color: iconColor }} /> <span>House</span>
                </Radio.Button>
              </Radio.Group>
            )}
        </Item>

        <Item label="Max # of Guests">
          {getFieldDecorator("numOfGuests", {
            rules: [
              {
                required: true,
                message: "Please enter a max number of guests!"
              }
            ]
          })(<InputNumber min={1} placeholder="4" />)}
        </Item>

        <Item label="Title" extra="Max character count of 45">
          {getFieldDecorator("title", {
            rules: [
              {
                required: true,
                message: "Please enter a title for your listing!"
              }
            ]
          })(<Input maxLength={45} placeholder="The iconic and luxurious Bel-Air mansion" />)}
        </Item>


        <Item label="Description of listing" extra="Max character count of 400">
          {getFieldDecorator("description", {
            rules: [
              {
                required: true,
                message: "Please enter a description for your listing!"
              }
            ]
          })(
            <Input.TextArea
              rows={3}
              maxLength={400}
              placeholder={`
                Modern, clean, and iconic home of the Fresh Prince.
                Situated in the heart of Bel-Air, Los Angeles.
              `}
            />
          )}
        </Item>

        <Item label="Address">
          {getFieldDecorator("address", {
            rules: [
              {
                required: true,
                message: "Please enter an address for your listing!"
              }
            ]
          })(<Input placeholder="251 North Bristol Avenue" />)}
        </Item>

        <Item label="City/Town">
          {getFieldDecorator("city", {
            rules: [
              {
                required: true,
                message: "Please enter a city (or region) for your listing!"
              }
            ]
          })(<Input placeholder="Los Angeles" />)}
        </Item>

        <Item label="State/Province">
          {getFieldDecorator("state", {
            rules: [
              {
                required: true,
                message: "Please enter a state for your listing!"
              }
            ]
          })(<Input placeholder="California" />)}
        </Item>

        <Item label="Zip/Postal Code">
          {getFieldDecorator("postalCode", {
            rules: [
              {
                required: true,
                message: "Please enter a zip code for your listing!"
              }
            ]
          })(<Input placeholder="Please enter a zip code for your listing!" />)}
        </Item>

        <Item label="Image" extra="Images have to be under 1MB in size and of type JPG or PNG">
          <div className="host__form-image-upload">
            {getFieldDecorator("image", {
              rules: [
                {
                  required: true,
                  message: "Please enter provide an image for your listing!"
                }
              ]
            })(<Upload
              name="image"
              listType="picture-card"
              showUploadList={false}
              action="https://www.mocky.io/v2/5cc8019d300000980a055e76"
              beforeUpload={beforeImageUpload}
              onChange={handleImageUpload}
            >
              {imageBase64Value ? (
                <img src={imageBase64Value} alt="Listing" />
              ) : (
                <div>
                  <Icon type={imageLoading ? "loading" : "plus"} /> 
                  <div className="ant-upload-text">Upload</div>
                </div>
              )}
            </Upload>)}
          </div>
        </Item>

        <Item label="Price" extra="All prices in $USD/day">
          {getFieldDecorator("price", {
            rules: [
              {
                required: true,
                message: "Please enter a price for your listing!"
              }
            ]
          })(<InputNumber min={0} placeholder="120" />)}
        </Item>

        <Item>
          <Button type="primary" htmlType="submit">Submit</Button>
        </Item>
      </Form>
    </Content>
  );
};

//IN Icon type in Upload part, icon is decided based on state variable imageLoading

const beforeImageUpload = (file: File) => {
  const fileIsValidImage = file.type === "image/jpeg" || file.type === "image/png";
  const fileIsValidSize = file.size / 1024 / 1024 < 1; //filesize is divided by 1024 2 times to convert it into binary

  if (!fileIsValidImage) {
    displayErrorMessage("You're only able to upload valid JPG or PNG files!");
    return false;
  }

  if (!fileIsValidSize) {
    displayErrorMessage(
      "You're only able to upload valid image files of under 1MB in size!"
    );
    return false;
  }

  return fileIsValidImage && fileIsValidSize;
};

const getBase64Value = (
  img: File | Blob, //Blog is another kind of object like File
  callback: (imageBase64Value: string) => void //base64 format is used to send files to servers as raw images cannot be efficiently sent
) => {
  const reader = new FileReader();
  reader.readAsDataURL(img); //readAsDataUrl converts img to base64 value
  reader.onload = () => { //onLoad() is triggered only when img is read fully
    callback(reader.result as string); //we re type checking as string here because result can also be in form of ArrayBuffer if img type is not jpeg or png
  };
};

export const WrappedHost = Form.create<Props & FormComponentProps>({ //This is a higher order function which wraps HOST component to give a form prop see ABOVE
  name: "host_form"
})(Host);