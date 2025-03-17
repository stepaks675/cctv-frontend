import { useState, useEffect } from "react";
import axios from "axios";
import "./index.css";

function App() {
  const [snapshots, setSnapshots] = useState([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);
  const [dailyComparisonSnapshot, setDailyComparisonSnapshot] = useState(null);
  const [weeklyComparisonSnapshot, setWeeklyComparisonSnapshot] =
    useState(null);
  const [breakdownSnapshots, setBreakdownSnapshots] = useState([]);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedRole, setSelectedRole] = useState("all");
  const [selectedChannels, setSelectedChannels] = useState([]);
  const [showChannelSelector, setShowChannelSelector] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState({});
  const [messageChangeFilter, setMessageChangeFilter] = useState("none");
  const [channelConfigs, setChannelConfigs] = useState([]);
  const [configName, setConfigName] = useState("");
  const [showConfigModal, setShowConfigModal] = useState(false);
  const importantRoles = [
    "Super Prover",
    "Helper Prover",
    "Prover",
    "Proofer",
    "Retired Prover",
    "PROVED UR LUV",
    "PROOF OF ART",
    "PROOF OF VIDEO",
    "PROOF OF DEV",
    "PROOF OF MUSIC",
    "PROOF OF WRITING",
    "Proof Verified",
    "lets pruv it",
  ];
  console.log(breakdownSnapshots)
  console.log(weeklyComparisonSnapshot)
  const roleColors = {
    "PROVED UR LUV": "text-purple-600 font-bold",
    "Prover": "text-blue-600 font-bold",
    "PROOF OF ART": "text-pink-300",
    "PROOF OF VIDEO": "text-red-300 ",
    "PROOF OF DEV": "text-green-300 ",
    "PROOF OF MUSIC": "text-yellow-300",
    "PROOF OF WRITING": "text-indigo-600 ",
    "Super Prover": "text-pink-800 font-bold",
    "Proofer": "text-purple-600 font-bold",
    "Helper Prover": "text-yellow-500 font-bold",
    "Proof Verified": "text-gray-600",
    "lets pruv it": "text-gray-300",
    "Retired Prover": "text-black font-bold"
  };

  const API_URL = "https://succinctrolecctv-production.up.railway.app/api";
  const API_KEY = "amogus";

  useEffect(() => {
    const fetchSnapshots = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_URL}/snapshots`, {
          headers: { "x-api-key": API_KEY },
        });
        setSnapshots(response.data);

        if (response.data.length > 0) {
          const latestSnapshot = response.data[0];
          const weeklyComparisonIndex = Math.min(42, response.data.length - 1);
          const dailyComparisonIndex = Math.min(6, response.data.length - 1);

          fetchSnapshotDetails(latestSnapshot.id);

          for (let i = 6; i <= 42; i += 6) {
            if (i <= weeklyComparisonIndex) {
              const breakdownSnapshotId = response.data[i].id;
              fetchBreakdownSnapshots(breakdownSnapshotId, i / 6 - 1);
            } else {
              setBreakdownSnapshots((prev) => {
                const newBreakdownSnapshots = [...prev];
                newBreakdownSnapshots[i / 6 - 1] = null;
                return newBreakdownSnapshots;
              });
            }
          }

          if (dailyComparisonIndex > 0 && dailyComparisonIndex < 6) {
            const dailySnapshotId = response.data[dailyComparisonIndex].id;
            fetchComparisonSnapshot(dailySnapshotId, "daily");
          }

          if (weeklyComparisonIndex > 0 && weeklyComparisonIndex < 42) {
            const weeklySnapshotId = response.data[weeklyComparisonIndex].id;
            fetchComparisonSnapshot(weeklySnapshotId, "weekly");
          }
        } else {
          setLoading(false);
        }
      } catch (err) {
        setError("Error loading snapshots: " + err.message);
        setLoading(false);
      }
    };

    fetchSnapshots();
    const savedConfigs = localStorage.getItem("channelConfigs");
    if (savedConfigs) {
      setChannelConfigs(JSON.parse(savedConfigs));
    }
  }, []);

  const fetchSnapshotDetails = async (snapshotId) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/snapshots/${snapshotId}`, {
        headers: { "x-api-key": API_KEY },
      });
      setSelectedSnapshot(response.data.snapshot);

      const filteredUsers = response.data.users.filter((user) => {
        const userRoles = user.roles.split(", ");
        return userRoles.some((role) => importantRoles.includes(role));
      });

      setUsers(filteredUsers);
      setLoading(false);

      setSelectedChannels([]);
      setExpandedUsers({});
    } catch (err) {
      setError("Error loading snapshot data: " + err.message);
      setLoading(false);
    }
  };

  const fetchBreakdownSnapshots = async (snapshotId, id) => {
    try {

      const response = await axios.get(`${API_URL}/snapshots/${snapshotId}`, {
        headers: { "x-api-key": API_KEY },
      });

      if (id === 0) setDailyComparisonSnapshot(response.data);
      if (id === 6) setWeeklyComparisonSnapshot(response.data);

      setBreakdownSnapshots((prev) => {
        const newBreakdownSnapshots = [...prev];
        newBreakdownSnapshots[id] = response.data;
        return newBreakdownSnapshots;
      });
    } catch (err) {}
  };

  const fetchComparisonSnapshot = async (snapshotId, type) => {
    try {
      const response = await axios.get(`${API_URL}/snapshots/${snapshotId}`, {
        headers: { "x-api-key": API_KEY },
      });

      if (type === "daily") {
        setDailyComparisonSnapshot(response.data);
      } else if (type === "weekly") {
        setWeeklyComparisonSnapshot(response.data);
      }
    } catch (err) {
      console.error(`Error loading ${type} comparison snapshot:`, err);
    }
  };

  const calculateDailyBreakdownChange = (user) => {
    let breakdown = [];
    let channelBreakdown = Array.from({ length: 8 }, () => []);

    breakdown.push(
      user.total_messages -
        (breakdownSnapshots[0]?.users.find((u) => u.user_id === user.user_id)
          ?.total_messages || 0)
    );

    for (let i = 1; i < 7; i++) {
      breakdown[i] =
        (breakdownSnapshots[i - 1]?.users.find(
          (u) => u.user_id === user.user_id
        )?.total_messages || 0) -
        (breakdownSnapshots[i]?.users.find((u) => u.user_id === user.user_id)
          ?.total_messages || 0);
    }

    user.channels.forEach((channel) => {
      channelBreakdown[0].push(
        channel.message_count -
          (breakdownSnapshots[0]?.users
            .find((u) => u.user_id === user.user_id)
            ?.channels.find((c) => c.channel_id === channel.channel_id)
            ?.message_count || 0)
      );
    });



    user.channels.forEach((channel) => {
      for (let i = 1; i < 7; i++) {
        channelBreakdown[i].push(
          (breakdownSnapshots[i - 1]?.users
            .find((u) => u.user_id === user.user_id)
            ?.channels.find((c) => c.channel_id === channel.channel_id)
            ?.message_count || 0) -
            (breakdownSnapshots[i]?.users
              .find((u) => u.user_id === user.user_id)
              ?.channels.find((c) => c.channel_id === channel.channel_id)
              ?.message_count || 0)
        );
      }
    });

    user.channels.forEach((channel) => {
      channelBreakdown[7]?.push(channel?.channel_id);
    });

    return {
      breakdown,
      channelBreakdown,
    };
  };

  const calculateMessageChange = (user, comparisonType) => {
    const comparisonSnapshot =
      comparisonType === "daily"
        ? dailyComparisonSnapshot
        : weeklyComparisonSnapshot;

    if (!comparisonSnapshot || !comparisonSnapshot.users) return null;

    const oldUserData = comparisonSnapshot.users.find(
      (u) => u.user_id === user.user_id
    );
    if (!oldUserData)
      return { total: user.total_messages, change: user.total_messages };

    const change = user.total_messages - oldUserData.total_messages;

    const channelChanges = user.channels.map((channel) => {
      const oldChannel = oldUserData.channels.find(
        (c) => c.channel_id === channel.channel_id
      );
      const oldCount = oldChannel ? oldChannel.message_count : 0;
      const channelChange = channel.message_count - oldCount;

      return {
        ...channel,
        change: channelChange,
      };
    });

    return {
      total: user.total_messages,
      change,
      channelChanges,
    };
  };

  const sortUserRoles = (rolesString) => {
    const userRoles = rolesString.split(", ");

    const sortedRoles = userRoles
      .filter((role) => importantRoles.includes(role))
      .sort((a, b) => {
        return importantRoles.indexOf(a) - importantRoles.indexOf(b);
      });

    return sortedRoles;
  };

  const toggleChannelExpansion = (userId) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const toggleChannelSelection = (channelName) => {
    setSelectedChannels((prev) => {
      if (prev.includes(channelName)) {
        return prev.filter((c) => c !== channelName);
      } else {
        return [...prev, channelName];
      }
    });
  };

  const clearSelectedChannels = () => {
    setSelectedChannels([]);
  };

  const selectAllChannels = (channels) => {
    setSelectedChannels([...channels]);
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.username
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) || 
      user.user_id.toString().includes(searchTerm);
    const matchesRole =
      selectedRole === "all" || user.roles.split(", ").includes(selectedRole);

    const matchesMultiChannel =
      selectedChannels.length === 0 ||
      user.channels.some((channel) =>
        selectedChannels.includes(channel.channel_name)
      );

    const hasActivityInSelectedChannels =
      selectedChannels.length === 0 ||
      user.channels.some(
        (channel) =>
          selectedChannels.includes(channel.channel_name) &&
          channel.message_count > 0
      );

    if (messageChangeFilter !== "none") {
      const changeData =
        messageChangeFilter === "daily"
          ? calculateMessageChange(user, "daily")
          : calculateMessageChange(user, "weekly");
    }

    return (
      matchesSearch &&
      matchesRole &&
      (selectedChannels.length > 0
        ? matchesMultiChannel && hasActivityInSelectedChannels
        : 1)
    );
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (messageChangeFilter === "none") {
      if (sortOrder === "desc") {
        return b.total_messages - a.total_messages;
      } else {
        return a.total_messages - b.total_messages;
      }
    } else {
      const changeA =
        calculateMessageChange(a, messageChangeFilter)?.change || 0;
      const changeB =
        calculateMessageChange(b, messageChangeFilter)?.change || 0;

      if (sortOrder === "desc") {
        return changeB - changeA;
      } else {
        return changeA - changeB;
      }
    }
  });

  const formatRole = (role) => {
    if (roleColors[role]) {
      return (
        <span key={role} className={roleColors[role]}>
          {role}
        </span>
      );
    }
    return <span key={role}>{role}</span>;
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === "desc" ? "asc" : "desc");
  };

  const uniqueChannels = Array.from(
    new Set(
      users.flatMap((user) =>
        user.channels.map((channel) => channel.channel_name)
      )
    )
  ).sort((a, b) => {
    const priorityKeywords = [
      "proof-of",
      "contributions",
      "memes",
      "submissions",
    ];
    const aHasPriority = priorityKeywords.some((keyword) =>
      a.toLowerCase().includes(keyword)
    );
    const bHasPriority = priorityKeywords.some((keyword) =>
      b.toLowerCase().includes(keyword)
    );
    return aHasPriority === bHasPriority ? 0 : aHasPriority ? -1 : 1;
  });
  const saveChannelConfig = () => {
    if (!configName.trim() || selectedChannels.length === 0) return;

    const newConfig = {
      id: Date.now(),
      name: configName.trim(),
      channels: [...selectedChannels],
    };

    const updatedConfigs = [...channelConfigs, newConfig];
    setChannelConfigs(updatedConfigs);
    localStorage.setItem("channelConfigs", JSON.stringify(updatedConfigs));

    setConfigName("");
    setShowConfigModal(false);
  };

  const loadChannelConfig = (config) => {
    setSelectedChannels(config.channels);
    setShowChannelSelector(false);
  };

  const deleteChannelConfig = (id, e) => {
    e.stopPropagation();
    const updatedConfigs = channelConfigs.filter((config) => config.id !== id);
    setChannelConfigs(updatedConfigs);
    localStorage.setItem("channelConfigs", JSON.stringify(updatedConfigs));
  };

  return (
    <div className="min-h-screen bg-pink-50">
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-8 text-pink-800 text-center pt-4">
          Discord Server Monitoring
        </h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 shadow-sm">
            {error}
          </div>
        )}

        <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-pink-200">
          <h2 className="text-2xl font-semibold mb-4 text-pink-700">
            Snapshots (better use the last one)
          </h2>
          {loading && snapshots.length === 0 ? (
            <p className="text-pink-600">Loading snapshots...</p>
          ) : (
            <select
              className="border border-pink-300 rounded-md p-2 w-full md:w-1/2 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={selectedSnapshot?.id || ""}
              onChange={(e) => fetchSnapshotDetails(e.target.value)}
            >
              {snapshots &&
                snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    {snapshot.name} (
                    {new Date(snapshot.created_at).toLocaleString()}) -{" "}
                    {snapshot.record_count} records
                  </option>
                ))}
            </select>
          )}
        </div>

        {selectedSnapshot && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow-md border border-pink-200">
            <h2 className="text-2xl font-semibold mb-3 text-pink-700">
              Snapshot: {selectedSnapshot.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-pink-100 p-4 rounded-lg">
                <p className="text-pink-800 font-medium">
                  Created:{" "}
                  {new Date(selectedSnapshot.created_at).toLocaleString()}
                </p>
              </div>
              <div className="bg-pink-100 p-4 rounded-lg">
                <p className="text-pink-800 font-medium">
                  Total users: {users.length}
                </p>
              </div>
              <div className="bg-pink-100 p-4 rounded-lg">
                <p className="text-pink-800 font-medium">
                  Total messages (since 11.03.2025):{" "}
                  {users.reduce((sum, user) => sum + user.total_messages, 0)}
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by username or ID..."
              className="border border-pink-300 rounded-md p-3 w-full pl-10 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 absolute left-3 top-3.5 text-pink-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>

          <div>
            <select
              className="border border-pink-300 rounded-md p-3 w-full focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              {importantRoles.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex">
              <button
                onClick={() => setShowChannelSelector(!showChannelSelector)}
                className="w-full bg-pink-500 hover:bg-pink-600 text-white font-medium py-3 px-4 rounded-md flex items-center"
              >
                Channels
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 ml-1 transition-transform ${
                    showChannelSelector ? "transform rotate-180" : ""
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>

            {showChannelSelector && (
              <div className="mt-2 p-4 bg-white border border-pink-300 rounded-md shadow-md">
                <div className="flex justify-between mb-2">
                  <h3 className="text-pink-700 font-medium">Select Channels</h3>
                  <div className="space-x-2">
                    <button
                      onClick={() => selectAllChannels(uniqueChannels)}
                      className="text-pink-600 hover:text-pink-800 text-sm font-medium"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelectedChannels}
                      className="text-pink-600 hover:text-pink-800 text-sm font-medium"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {channelConfigs.length > 0 && (
                  <div className="mb-3">
                    <h4 className="text-sm font-medium text-pink-700 mb-1">
                      Saved Configurations:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {channelConfigs.map((config) => (
                        <div
                          key={config.id}
                          onClick={() => loadChannelConfig(config)}
                          className="bg-pink-100 hover:bg-pink-200 text-pink-800 px-3 py-1 rounded-md text-sm cursor-pointer flex items-center"
                        >
                          {config.name} ({config.channels.length})
                          <button
                            onClick={(e) => deleteChannelConfig(config.id, e)}
                            className="ml-2 text-pink-600 hover:text-pink-800"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="max-h-60 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {uniqueChannels.map((channel) => (
                    <div key={channel} className="flex items-center">
                      <input
                        type="checkbox"
                        id={`channel-${channel}`}
                        checked={selectedChannels.includes(channel)}
                        onChange={() => toggleChannelSelection(channel)}
                        className="mr-2 h-4 w-4 text-pink-600 focus:ring-pink-500 rounded"
                      />
                      <label htmlFor={`channel-${channel}`} className="text-sm">
                        {channel}
                      </label>
                    </div>
                  ))}
                </div>

                <div className="mt-3 text-sm">
                  <p className="text-pink-600">
                    {selectedChannels.length} channels selected
                  </p>
                  {selectedChannels.length > 0 && (
                    <div className="flex items-center mt-2">
                      <button
                        onClick={() => setShowConfigModal(true)}
                        className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-1 px-3 rounded-md text-sm"
                      >
                        Save Configuration
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <select
              className="border border-pink-300 rounded-md p-3 w-full focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={messageChangeFilter}
              onChange={(e) => setMessageChangeFilter(e.target.value)}
            >
              <option value="none">Total Messages</option>
              <option value="daily">Daily Change</option>
              <option value="weekly">Weekly Change</option>
            </select>

            <button
              onClick={toggleSortOrder}
              className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-md flex items-center justify-center"
            >
              {sortOrder === "desc" ? "Highest First" : "Lowest First"}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-5 w-5 ml-2 ${
                  sortOrder === "desc" ? "transform rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>

          {selectedChannels.length > 0 && (
            <div className="md:col-span-3 flex flex-wrap gap-2 mt-2">
              <span className="text-pink-700 font-medium">
                Filtered channels:
              </span>
              {selectedChannels.map((channel) => (
                <span
                  key={channel}
                  className="bg-pink-200 text-pink-800 px-2 py-1 rounded-full text-sm flex items-center"
                >
                  {channel}
                  <button
                    onClick={() => toggleChannelSelection(channel)}
                    className="ml-1 text-pink-600 hover:text-pink-800"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
              <button
                onClick={clearSelectedChannels}
                className="text-pink-600 hover:text-pink-800 text-sm underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {loading && users.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-pink-600 text-lg">Loading user data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-pink-200">
            <table className="min-w-full">
              <thead>
                <tr className="bg-pink-200">
                  <th className="py-3 px-4 text-left text-pink-800">User</th>
                  <th className="py-3 px-4 text-left text-pink-800">Roles</th>
                  <th className="py-3 px-4 text-center text-pink-800">
                    Total Messages
                  </th>
                  <th className="py-3 px-4 text-center text-pink-800">
                    Daily Change
                  </th>
                  <th className="py-3 px-4 text-center text-pink-800">
                    Weekly Change
                  </th>
                  <th className="py-3 px-4 text-left text-pink-800">
                    Channel Activity
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedUsers.map((user, index) => {
                  const dailyMessageData = calculateMessageChange(
                    user,
                    "daily"
                  );

                  const weeklyMessageData = calculateMessageChange(
                    user,
                    "weekly"
                  );

                  const breakdownData = calculateDailyBreakdownChange(user);
                  const dailyChange = dailyMessageData?.change || 0;
                  const weeklyChange = weeklyMessageData?.change || 0;

                  let rowClass = index % 2 === 0 ? "bg-white" : "bg-pink-50";

                  if (weeklyChange === 0) {
                    rowClass = "bg-red-100";
                  } else if (dailyChange === 0) {
                    rowClass = "bg-orange-100";
                  }

                  const sortedRoles = sortUserRoles(user.roles);

                  const formattedRoles = sortedRoles.map((role, idx) => {
                    const element = formatRole(role);

                    if (idx < sortedRoles.length - 1) {
                      return [element, <span key={`comma-${idx}`}>, </span>];
                    }
                    return element;
                  });

                  const isExpanded = expandedUsers[user.user_id] || false;

                  let userChannels = [...user.channels];
                  if (selectedChannels.length > 0) {
                    userChannels = userChannels.filter((channel) =>
                      selectedChannels.includes(channel.channel_name)
                    );
                  }

                  const sortedChannels = userChannels.sort((a, b) => b.message_count - a.message_count);

                  const displayChannels = isExpanded
                    ? sortedChannels
                    : sortedChannels.slice(0, 5);

                  return (
                    <tr key={index} className={rowClass}>
                      <td className="py-3 pl-4 border-b border-pink-100 font-medium">
                        {user.username}
                        <div className="text-xs text-gray-500">ID: {user.user_id}</div>
                      </td>
                      <td className="py-3 px-0 border-b border-pink-100">
                        {formattedRoles}
                      </td>
                      <td className="py-3 px-0 border-b border-pink-100 text-center">
                        {user.total_messages}
                      </td>

                      <td className="py-3 px-4 border-b border-pink-100 text-center">
                        {dailyMessageData &&
                        dailyMessageData.change !== null ? (
                          <span
                            className={`font-medium ${
                              dailyMessageData.change > 0
                                ? "text-green-600"
                                : dailyMessageData.change < 0
                                ? "text-red-600"
                                : "text-orange-500 font-bold"
                            }`}
                          >
                            {dailyMessageData.change > 0 ? "+" : ""}
                            {dailyMessageData.change}
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      <td className="py-3 px-4 border-b border-pink-100 text-center">
                        {weeklyMessageData &&
                        weeklyMessageData.change !== null ? (
                          <span
                            className={`font-medium ${
                              weeklyMessageData.change > 0
                                ? "text-green-600"
                                : weeklyMessageData.change < 0
                                ? "text-red-600"
                                : "text-red-500 font-bold"
                            }`}
                          >
                            {weeklyMessageData.change > 0 ? "+" : ""}
                            {weeklyMessageData.change}
                            <br />
                            <span className="text-sm text-gray-500">
                              [
                              {breakdownData.breakdown.map((num, index) => {
                                return (
                                  <span
                                    className={
                                      num > 0
                                        ? "text-green-600"
                                        : "text-red-600"
                                    }
                                    key={index}
                                  >
                                    {num}
                                    {index != 6 ? ", " : ""}
                                  </span>
                                );
                              })}
                              ]
                            </span>
                          </span>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>

                      <td className="py-3 px-4 border-b border-pink-100">
                        <div
                          className="cursor-pointer"
                          onClick={() => toggleChannelExpansion(user.user_id)}
                        >
                          <ul className="list-disc pl-5">
                            {displayChannels.map((channel, index) => {
                              const dailyChannelChange =
                                dailyMessageData &&
                                dailyMessageData.channelChanges
                                  ? dailyMessageData.channelChanges.find(
                                      (c) => c.channel_id === channel.channel_id
                                    )?.change
                                  : null;

                              const weeklyChannelChange =
                                weeklyMessageData &&
                                weeklyMessageData.channelChanges
                                  ? weeklyMessageData.channelChanges.find(
                                      (c) => c.channel_id === channel.channel_id
                                    )?.change
                                  : null;

                              return (
                                <li key={channel.channel_id} className="mb-1">
                                  <div className="flex flex-wrap items-center">
                                    <span className="font-medium">
                                      {channel.channel_name}:
                                    </span>
                                    <span className="ml-1">
                                      {channel.message_count} messages
                                    </span>

                                    {dailyChannelChange !== null &&
                                      dailyChannelChange !== 0 && (
                                        <span
                                          className={`ml-2 
     
                                               text-green-600
        
                                           font-medium`}
                                        >
                                          ({dailyChannelChange > 0 ? "+" : ""}
                                          {dailyChannelChange})
                                        </span>
                                      )}

                                    {weeklyChannelChange !== null &&
                                      weeklyChannelChange !== 0 && (
                                        <span
                                          className={`ml-2 pr-2
                                      
                                               text-blue-600
                  
                                           font-medium`}
                                        >
                                          [{""}
                                          {weeklyChannelChange > 0 ? "+" : ""}
                                          {weeklyChannelChange}]
                                        </span>
                                      )}
                                    
                                    [{breakdownData.channelBreakdown.map((num, ind) => {
                                      if (ind == 7) return null;

                                      const realindex = breakdownData?.channelBreakdown[7]?.indexOf(channel.channel_id);
                                      return (

                                        <span className={(num[realindex] > 0 ? "text-green-600" : "text-red-600") + " pr-1  "} key={ind}>
                                          {num[realindex]}  
                                          {(ind != 6 ? ", " : "")}
                                          
                                        </span>
                                      );
                                    })}]
                                  </div>
                                </li>
                              );
                            })}

                            {!isExpanded && displayChannels.length > 5 && (
                              <li className="text-pink-500 font-medium mt-1 hover:text-pink-700">
                                Click to show all {displayChannels.length}{" "}
                                channels
                              </li>
                            )}
                            {isExpanded && displayChannels.length > 5 && (
                              <li className="text-pink-500 font-medium mt-1 hover:text-pink-700">
                                Click to collapse
                              </li>
                            )}
                          </ul>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {sortedUsers.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-pink-600">
                      No users found matching the selected filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showConfigModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h3 className="text-xl font-semibold text-pink-700 mb-4">
              Save Channel Configuration
            </h3>
            <input
              type="text"
              placeholder="Configuration name"
              className="border border-pink-300 rounded-md p-2 w-full mb-4 focus:outline-none focus:ring-2 focus:ring-pink-500"
              value={configName}
              onChange={(e) => setConfigName(e.target.value)}
            />
            <p className="text-sm text-gray-600 mb-4">
              This will save your current selection of {selectedChannels.length}{" "}
              channels.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfigModal(false)}
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={saveChannelConfig}
                className="bg-pink-500 hover:bg-pink-600 text-white font-medium py-2 px-4 rounded-md"
                disabled={!configName.trim() || selectedChannels.length === 0}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
