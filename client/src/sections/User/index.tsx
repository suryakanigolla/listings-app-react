import React, { useEffect, useState } from "react";
import { useQuery } from "@apollo/react-hooks";
import { useParams } from "react-router-dom";
import { Layout, Col, Row } from "antd";
import { USER } from "../../lib/graphql";
import { UserProfile, UserListings, UserBookings } from "./components";
import {
  User as UserData,
  UserVariables
} from "../../lib/graphql/queries/User/__generated__/User";
import { Viewer } from "../../lib/types";
import { PageSkeleton, ErrorBanner } from "../../lib/components";
import { useScrollToTop } from "../../lib/hooks";

interface MatchParams {
  id: string;
}

interface Props {
  viewer: Viewer;
  setViewer: (viewer: Viewer) => void;
}

const { Content } = Layout;
const PAGE_LIMIT = 4;

export const User = ({ viewer, setViewer }: Props) => {
  const [bookingsPage, setBookingsPage] = useState(1);
  const [listingsPage, setListingsPage] = useState(1);
  const [limit, setLimit] = useState(4);

  const calPageSize = () : number => {
    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
    let limit = 4;
    console.log(vw)
    if (vw < 992) {
      limit=4;
    }
    if (vw >= 992 && vw < 1200) {
        limit=4;
    }
    else if (vw >= 1600) {
      limit=6;
    }
    return limit;
  }

  useEffect(() => {
    let limit = calPageSize();
    setLimit(limit);
  },[])

  const { id } = useParams<MatchParams>();
  const { data, loading, error,refetch } = useQuery<UserData, UserVariables>(USER, {
    variables: {
      id,
      bookingsPage,
      listingsPage,
      limit: limit
    },
    fetchPolicy: "cache-and-network"
  });

  useScrollToTop();

  const handleUserRefetch = async () => {
    await refetch();
  };

  const stripeError = new URL(window.location.href).searchParams.get(
    "stripe_error"
  );
  const stripeErrorBanner = stripeError ? (
    <ErrorBanner description="We had an issue connecting with Stripe. Please try again soon." />
  ) : null;

  if (loading) {
    return (
      <Content className="user">
        <PageSkeleton />
      </Content>
    );
  }

  if (error) {
    return (
      <Content className="user">
        <ErrorBanner description="This user may not exist or we 've encountered an error. Please try again soon" />
        <PageSkeleton />
      </Content>
    );
  }

  const user = data?.user ? data.user : null;
  const viewerIsUser = viewer.id === id;
  const userListings = user ? user.listings : null;
  const userBookings = user ? user.bookings : null;

  const userProfileElement = user ? (
    <UserProfile
      user={user}
      viewerIsUser={viewerIsUser}
      viewer={viewer}
      setViewer={setViewer}
      handleUserRefetch={handleUserRefetch}
    />
  ) : null;

  const userListingsElement = userListings ? (
    <UserListings
      userListings={userListings}
      listingsPage={listingsPage}
      limit={limit}
      setListingsPage={setListingsPage}
    />
  ) : null;

  const userBookingsElement = userBookings ? (
    <UserBookings
      userBookings={userBookings}
      bookingsPage={bookingsPage}
      limit={limit}
      setBookingsPage={setBookingsPage}
    />
  ) : null;

  return (
    <Content className="user">
      {stripeErrorBanner}
      <Row gutter={12} type="flex" justify="space-between">
        <Col xs={24}>{userProfileElement}</Col>
        <Col xs={24}>
          {userListingsElement}
          {userBookingsElement}
        </Col>
      </Row>
    </Content>
  );
};
