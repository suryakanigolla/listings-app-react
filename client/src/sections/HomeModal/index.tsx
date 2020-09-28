import { Icon, Modal, Typography } from "antd";
import React from "react";
import { Link } from "react-router-dom";

interface Props {
    homeModalVisible : boolean
    setHomeModalVisible : (homeModalVisible : boolean) => void
}

const {Title, Paragraph} = Typography

export const HomeModal = ({homeModalVisible, setHomeModalVisible} : Props) => {

    return (
        <Modal
            visible={homeModalVisible}
            centered
            footer={null}
            onCancel={() => setHomeModalVisible(false)}
        >

            <div className="listing-booking-modal">
                <div className="listing-booking-modal__intro">
                    <Title className="listing-booking-modal__intro-title" level={3}>
                        Hello! <Icon type="smile" theme="twoTone" />
                    </Title>
                    <Paragraph>
                        This website is part of my portfolio. {<br></br>} Source code is available at my <Link to="https://github.com/suryakanigolla">GitHub</Link> profile
                    </Paragraph>
                </div>
            </div>


        </Modal>
    )
}